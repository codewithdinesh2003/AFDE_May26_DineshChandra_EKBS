from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models
from auth import require_roles

router = APIRouter()


@router.get("/dashboard")
def get_dashboard(
    current_user: models.User = Depends(require_roles("admin", "reviewer")),
    db: Session = Depends(get_db)
):
    try:
        total_articles = db.query(func.count(models.Article.id)).scalar()
        approved_articles = db.query(func.count(models.Article.id)).filter(
            models.Article.status == "approved"
        ).scalar()
        pending_articles = db.query(func.count(models.Article.id)).filter(
            models.Article.status == "pending"
        ).scalar()
        draft_articles = db.query(func.count(models.Article.id)).filter(
            models.Article.status == "draft"
        ).scalar()
        rejected_articles = db.query(func.count(models.Article.id)).filter(
            models.Article.status == "rejected"
        ).scalar()
        archived_articles = db.query(func.count(models.Article.id)).filter(
            models.Article.status == "archived"
        ).scalar()

        total_users = db.query(func.count(models.User.id)).scalar()
        total_categories = db.query(func.count(models.Category.id)).scalar()
        total_tags = db.query(func.count(models.Tag.id)).scalar()

        most_viewed = db.query(models.Article).filter(
            models.Article.status == "approved"
        ).order_by(models.Article.view_count.desc()).limit(5).all()

        recent_articles = db.query(models.Article).order_by(
            models.Article.created_at.desc()
        ).limit(5).all()

        articles_by_category = db.query(
            models.Category.name,
            func.count(models.Article.id).label("count")
        ).join(models.Article, models.Article.category_id == models.Category.id).group_by(
            models.Category.id
        ).all()

        top_rated = db.query(
            models.Article.id,
            models.Article.title,
            func.avg(models.Rating.rating).label("avg_rating")
        ).join(models.Rating).filter(
            models.Article.status == "approved"
        ).group_by(models.Article.id).order_by(
            func.avg(models.Rating.rating).desc()
        ).limit(5).all()

        return {
            "success": True,
            "message": "Dashboard data retrieved",
            "data": {
                "total_articles": total_articles,
                "approved_articles": approved_articles,
                "pending_articles": pending_articles,
                "draft_articles": draft_articles,
                "total_users": total_users,
                "total_categories": total_categories,
                "total_tags": total_tags,
                "most_viewed": [
                    {"id": a.id, "title": a.title, "view_count": a.view_count}
                    for a in most_viewed
                ],
                "recent_articles": [
                    {
                        "id": a.id,
                        "title": a.title,
                        "status": a.status,
                        "created_at": a.created_at.isoformat()
                    }
                    for a in recent_articles
                ],
                "articles_by_status": {
                    "draft": draft_articles,
                    "pending": pending_articles,
                    "approved": approved_articles,
                    "rejected": rejected_articles,
                    "archived": archived_articles
                },
                "articles_by_category": [
                    {"category_name": r.name, "count": r.count}
                    for r in articles_by_category
                ],
                "top_rated": [
                    {
                        "id": r.id,
                        "title": r.title,
                        "avg_rating": float(round(r.avg_rating, 2)) if r.avg_rating else None
                    }
                    for r in top_rated
                ]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
