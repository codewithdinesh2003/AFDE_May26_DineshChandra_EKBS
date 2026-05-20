from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models
from auth import get_current_user

router = APIRouter()


@router.post("/{article_id}")
def toggle_bookmark(
    article_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        article = db.query(models.Article).filter(models.Article.id == article_id).first()
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")

        existing = db.query(models.Bookmark).filter(
            models.Bookmark.article_id == article_id,
            models.Bookmark.user_id == current_user.id
        ).first()

        if existing:
            db.delete(existing)
            db.commit()
            return {"success": True, "message": "Bookmark removed", "data": {"bookmarked": False}}
        else:
            bookmark = models.Bookmark(article_id=article_id, user_id=current_user.id)
            db.add(bookmark)
            db.commit()
            return {"success": True, "message": "Bookmark added", "data": {"bookmarked": True}}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
def get_my_bookmarks(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        bookmarks = db.query(models.Bookmark).filter(
            models.Bookmark.user_id == current_user.id
        ).all()

        result = []
        for bm in bookmarks:
            article = bm.article
            if article:
                avg_rating = db.query(func.avg(models.Rating.rating)).filter(
                    models.Rating.article_id == article.id
                ).scalar()
                tags = [{"id": at.tag.id, "name": at.tag.name} for at in article.article_tags]
                result.append({
                    "bookmark_id": bm.id,
                    "article": {
                        "id": article.id,
                        "title": article.title,
                        "summary": article.summary,
                        "status": article.status,
                        "view_count": article.view_count,
                        "created_at": article.created_at.isoformat(),
                        "category_name": article.category.name if article.category else None,
                        "author_name": article.author.name if article.author else None,
                        "tags": tags,
                        "avg_rating": float(round(avg_rating, 2)) if avg_rating else None,
                    },
                    "bookmarked_at": bm.created_at.isoformat()
                })

        return {"success": True, "message": "Bookmarks retrieved", "data": {"bookmarks": result}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
