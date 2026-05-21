from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from typing import Optional
from database import get_db
import models
from auth import get_current_user, get_current_user_optional

router = APIRouter()


@router.get("")
def search_articles(
    q: str = Query(""),
    category_id: Optional[int] = None,
    tag: Optional[str] = None,
    author_id: Optional[int] = None,
    sort: Optional[str] = "latest",
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    try:
        query = db.query(models.Article).filter(models.Article.status == "approved")

        if q:
            query = query.filter(
                models.Article.title.ilike(f"%{q}%") |
                models.Article.content.ilike(f"%{q}%") |
                models.Article.summary.ilike(f"%{q}%")
            )

        if category_id:
            query = query.filter(models.Article.category_id == category_id)

        if tag:
            query = query.join(models.ArticleTag).join(models.Tag).filter(
                models.Tag.name == tag
            )

        if author_id:
            query = query.filter(models.Article.author_id == author_id)

        if sort == "popular":
            query = query.order_by(models.Article.view_count.desc())
        else:
            query = query.order_by(models.Article.created_at.desc())

        total = query.count()
        articles = query.offset((page - 1) * limit).limit(limit).all()

        result = []
        for article in articles:
            avg_rating = db.query(func.avg(models.Rating.rating)).filter(
                models.Rating.article_id == article.id
            ).scalar()

            tags = [{"id": at.tag.id, "name": at.tag.name} for at in article.article_tags]

            result.append({
                "id": article.id,
                "title": article.title,
                "summary": article.summary,
                "category_id": article.category_id,
                "category_name": article.category.name if article.category else None,
                "author_id": article.author_id,
                "author_name": article.author.name if article.author else None,
                "status": article.status,
                "view_count": article.view_count,
                "created_at": article.created_at.isoformat(),
                "tags": tags,
                "avg_rating": float(round(avg_rating, 2)) if avg_rating else None,
            })

        try:
            log = models.SearchLog(
                keyword=q or "",
                user_id=current_user.id if current_user else None,
                results_count=total,
            )
            db.add(log)
            db.commit()
        except Exception:
            pass

        return {
            "success": True,
            "message": "Search results retrieved",
            "data": {
                "articles": result,
                "total_count": total,
                "page": page,
                "limit": limit,
                "total_pages": (total + limit - 1) // limit,
                "query": q
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
