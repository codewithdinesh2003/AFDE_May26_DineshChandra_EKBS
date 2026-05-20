from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter()


@router.get("/articles/{article_id}/comments")
def get_comments(article_id: int, db: Session = Depends(get_db)):
    try:
        article = db.query(models.Article).filter(models.Article.id == article_id).first()
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")

        comments = db.query(models.Comment).filter(
            models.Comment.article_id == article_id
        ).order_by(models.Comment.created_at.asc()).all()

        return {
            "success": True,
            "message": "Comments retrieved",
            "data": {
                "comments": [
                    {
                        "id": c.id,
                        "article_id": c.article_id,
                        "user_id": c.user_id,
                        "user_name": c.user.name if c.user else None,
                        "comment_text": c.comment_text,
                        "created_at": c.created_at.isoformat()
                    }
                    for c in comments
                ]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/articles/{article_id}/comments")
def add_comment(
    article_id: int,
    request: schemas.CommentCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        article = db.query(models.Article).filter(models.Article.id == article_id).first()
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")

        comment = models.Comment(
            article_id=article_id,
            user_id=current_user.id,
            comment_text=request.comment_text
        )
        db.add(comment)
        db.commit()
        db.refresh(comment)

        return {
            "success": True,
            "message": "Comment added",
            "data": {
                "id": comment.id,
                "article_id": comment.article_id,
                "user_id": comment.user_id,
                "user_name": current_user.name,
                "comment_text": comment.comment_text,
                "created_at": comment.created_at.isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")

        if comment.user_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Access denied")

        db.delete(comment)
        db.commit()

        return {"success": True, "message": "Comment deleted", "data": {}}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
