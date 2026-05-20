from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models, schemas
from auth import get_current_user, require_roles

router = APIRouter()


@router.get("")
def list_tags(db: Session = Depends(get_db)):
    try:
        tags = db.query(models.Tag).all()
        result = []
        for tag in tags:
            count = db.query(func.count(models.ArticleTag.article_id)).filter(
                models.ArticleTag.article_tag_id == tag.id
            ).scalar()
            result.append({"id": tag.id, "name": tag.name, "usage_count": count})

        return {"success": True, "message": "Tags retrieved", "data": {"tags": result}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
def create_tag(
    request: schemas.TagCreate,
    current_user: models.User = Depends(require_roles("admin", "author")),
    db: Session = Depends(get_db)
):
    try:
        existing = db.query(models.Tag).filter(models.Tag.name == request.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Tag already exists")

        tag = models.Tag(name=request.name)
        db.add(tag)
        db.commit()
        db.refresh(tag)

        return {"success": True, "message": "Tag created", "data": {"id": tag.id, "name": tag.name}}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{tag_id}")
def delete_tag(
    tag_id: int,
    current_user: models.User = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    try:
        tag = db.query(models.Tag).filter(models.Tag.id == tag_id).first()
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")

        db.delete(tag)
        db.commit()

        return {"success": True, "message": "Tag deleted", "data": {}}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
