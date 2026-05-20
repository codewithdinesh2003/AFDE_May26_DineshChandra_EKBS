from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models, schemas
from typing import Optional
from auth import get_current_user, get_current_user_optional

router = APIRouter()


@router.post("/{article_id}/rate")
def rate_article(
    article_id: int,
    request: schemas.RatingCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        article = db.query(models.Article).filter(models.Article.id == article_id).first()
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")

        existing = db.query(models.Rating).filter(
            models.Rating.article_id == article_id,
            models.Rating.user_id == current_user.id
        ).first()

        if existing:
            existing.rating = request.rating
        else:
            rating = models.Rating(
                article_id=article_id,
                user_id=current_user.id,
                rating=request.rating
            )
            db.add(rating)

        db.commit()

        avg = db.query(func.avg(models.Rating.rating)).filter(
            models.Rating.article_id == article_id
        ).scalar()

        return {
            "success": True,
            "message": "Rating saved",
            "data": {
                "avg_rating": float(round(avg, 2)) if avg else None,
                "user_rating": request.rating
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{article_id}/rating")
def get_rating(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    try:
        avg = db.query(func.avg(models.Rating.rating)).filter(
            models.Rating.article_id == article_id
        ).scalar()

        total = db.query(func.count(models.Rating.id)).filter(
            models.Rating.article_id == article_id
        ).scalar()

        user_rating = None
        if current_user:
            existing = db.query(models.Rating).filter(
                models.Rating.article_id == article_id,
                models.Rating.user_id == current_user.id
            ).first()
            if existing:
                user_rating = existing.rating

        return {
            "success": True,
            "message": "Rating retrieved",
            "data": {
                "avg_rating": float(round(avg, 2)) if avg else None,
                "total_ratings": total,
                "user_rating": user_rating
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
