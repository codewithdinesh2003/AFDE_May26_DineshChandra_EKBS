import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
import models
from auth import get_current_user

router = APIRouter()

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "png", "jpg", "jpeg"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/articles/{article_id}/attachments")
async def upload_attachment(
    article_id: int,
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        article = db.query(models.Article).filter(models.Article.id == article_id).first()
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")

        if current_user.role != "admin" and article.author_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

        ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"File type .{ext} not allowed")

        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

        article_upload_dir = os.path.join(UPLOAD_DIR, str(article_id))
        os.makedirs(article_upload_dir, exist_ok=True)

        unique_filename = f"{uuid.uuid4().hex}.{ext}"
        file_path = os.path.join(article_upload_dir, unique_filename)

        with open(file_path, "wb") as f:
            f.write(content)

        attachment = models.Attachment(
            article_id=article_id,
            filename=unique_filename,
            original_name=file.filename,
            file_type=ext,
            file_size=len(content)
        )
        db.add(attachment)
        db.commit()
        db.refresh(attachment)

        return {
            "success": True,
            "message": "File uploaded successfully",
            "data": {
                "id": attachment.id,
                "article_id": attachment.article_id,
                "filename": attachment.filename,
                "original_name": attachment.original_name,
                "file_type": attachment.file_type,
                "file_size": attachment.file_size,
                "uploaded_at": attachment.uploaded_at.isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/articles/{article_id}/attachments")
def list_attachments(article_id: int, db: Session = Depends(get_db)):
    try:
        attachments = db.query(models.Attachment).filter(
            models.Attachment.article_id == article_id
        ).all()

        return {
            "success": True,
            "message": "Attachments retrieved",
            "data": {
                "attachments": [
                    {
                        "id": a.id,
                        "article_id": a.article_id,
                        "filename": a.filename,
                        "original_name": a.original_name,
                        "file_type": a.file_type,
                        "file_size": a.file_size,
                        "uploaded_at": a.uploaded_at.isoformat()
                    }
                    for a in attachments
                ]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/attachments/{attachment_id}")
def delete_attachment(
    attachment_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        attachment = db.query(models.Attachment).filter(models.Attachment.id == attachment_id).first()
        if not attachment:
            raise HTTPException(status_code=404, detail="Attachment not found")

        article = attachment.article
        if current_user.role != "admin" and article.author_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

        file_path = os.path.join(UPLOAD_DIR, str(attachment.article_id), attachment.filename)
        if os.path.exists(file_path):
            os.remove(file_path)

        db.delete(attachment)
        db.commit()

        return {"success": True, "message": "Attachment deleted", "data": {}}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/attachments/{attachment_id}/download")
def download_attachment(attachment_id: int, db: Session = Depends(get_db)):
    try:
        attachment = db.query(models.Attachment).filter(models.Attachment.id == attachment_id).first()
        if not attachment:
            raise HTTPException(status_code=404, detail="Attachment not found")

        file_path = os.path.join(UPLOAD_DIR, str(attachment.article_id), attachment.filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found on disk")

        return FileResponse(
            path=file_path,
            filename=attachment.original_name,
            media_type="application/octet-stream"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
