from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from database import get_db
import models, schemas
from auth import get_current_user, get_current_user_optional, require_roles

router = APIRouter()


def article_to_dict(article, db: Session, current_user=None):
    avg_rating = db.query(func.avg(models.Rating.rating)).filter(
        models.Rating.article_id == article.id
    ).scalar()

    tags = []
    for at in article.article_tags:
        tags.append({"id": at.tag.id, "name": at.tag.name})

    return {
        "id": article.id,
        "title": article.title,
        "content": article.content,
        "summary": article.summary,
        "category_id": article.category_id,
        "category_name": article.category.name if article.category else None,
        "author_id": article.author_id,
        "author_name": article.author.name if article.author else None,
        "status": article.status,
        "view_count": article.view_count,
        "created_at": article.created_at.isoformat(),
        "updated_at": article.updated_at.isoformat(),
        "tags": tags,
        "avg_rating": float(round(avg_rating, 2)) if avg_rating else None,
    }


@router.get("")
def list_articles(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    category_id: Optional[int] = None,
    tag: Optional[str] = None,
    status: Optional[str] = None,
    sort: Optional[str] = "latest",
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    try:
        query = db.query(models.Article)

        # Default: only approved articles for public
        if not current_user or current_user.role not in ["admin", "reviewer"]:
            query = query.filter(models.Article.status == "approved")
        elif status:
            query = query.filter(models.Article.status == status)

        if category_id:
            query = query.filter(models.Article.category_id == category_id)

        if tag:
            query = query.join(models.ArticleTag).join(models.Tag).filter(
                models.Tag.name == tag
            )

        if sort == "popular":
            query = query.order_by(models.Article.view_count.desc())
        else:
            query = query.order_by(models.Article.created_at.desc())

        total = query.count()
        articles = query.offset((page - 1) * limit).limit(limit).all()

        return {
            "success": True,
            "message": "Articles retrieved",
            "data": {
                "articles": [article_to_dict(a, db) for a in articles],
                "total": total,
                "page": page,
                "limit": limit,
                "total_pages": (total + limit - 1) // limit
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
def create_article(
    request: schemas.ArticleCreate,
    current_user: models.User = Depends(require_roles("admin", "author")),
    db: Session = Depends(get_db)
):
    try:
        article = models.Article(
            title=request.title,
            content=request.content,
            summary=request.summary,
            category_id=request.category_id,
            author_id=current_user.id,
            status="draft"
        )
        db.add(article)
        db.flush()

        for tag_id in (request.tag_ids or []):
            tag = db.query(models.Tag).filter(models.Tag.id == tag_id).first()
            if tag:
                article_tag = models.ArticleTag(article_id=article.id, article_tag_id=tag_id)
                db.add(article_tag)

        db.commit()
        db.refresh(article)

        return {
            "success": True,
            "message": "Article created successfully",
            "data": article_to_dict(article, db)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/my")
def get_my_articles(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(models.Article).filter(models.Article.author_id == current_user.id)
        total = query.count()
        articles = query.order_by(models.Article.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

        return {
            "success": True,
            "message": "My articles retrieved",
            "data": {
                "articles": [article_to_dict(a, db) for a in articles],
                "total": total,
                "page": page,
                "limit": limit,
                "total_pages": (total + limit - 1) // limit
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pending")
def get_pending_articles(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: models.User = Depends(require_roles("admin", "reviewer")),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(models.Article).filter(models.Article.status == "pending")
        total = query.count()
        articles = query.order_by(models.Article.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

        return {
            "success": True,
            "message": "Pending articles retrieved",
            "data": {
                "articles": [article_to_dict(a, db) for a in articles],
                "total": total,
                "page": page,
                "limit": limit,
                "total_pages": (total + limit - 1) // limit
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{article_id}")
def get_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    try:
        article = db.query(models.Article).filter(models.Article.id == article_id).first()
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")

        # Access control
        if article.status != "approved":
            if not current_user:
                raise HTTPException(status_code=403, detail="Access denied")
            if current_user.role not in ["admin", "reviewer"] and article.author_id != current_user.id:
                raise HTTPException(status_code=403, detail="Access denied")

        article.view_count += 1
        db.commit()
        db.refresh(article)

        return {
            "success": True,
            "message": "Article retrieved",
            "data": article_to_dict(article, db)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{article_id}")
def update_article(
    article_id: int,
    request: schemas.ArticleUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        article = db.query(models.Article).filter(models.Article.id == article_id).first()
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")

        if current_user.role != "admin" and article.author_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

        if request.title is not None:
            article.title = request.title
        if request.content is not None:
            article.content = request.content
        if request.summary is not None:
            article.summary = request.summary
        if request.category_id is not None:
            article.category_id = request.category_id

        if request.tag_ids is not None:
            db.query(models.ArticleTag).filter(models.ArticleTag.article_id == article_id).delete()
            for tag_id in request.tag_ids:
                tag = db.query(models.Tag).filter(models.Tag.id == tag_id).first()
                if tag:
                    article_tag = models.ArticleTag(article_id=article.id, article_tag_id=tag_id)
                    db.add(article_tag)

        db.commit()
        db.refresh(article)

        return {
            "success": True,
            "message": "Article updated successfully",
            "data": article_to_dict(article, db)
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{article_id}")
def delete_article(
    article_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        article = db.query(models.Article).filter(models.Article.id == article_id).first()
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")

        if current_user.role != "admin" and article.author_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

        db.delete(article)
        db.commit()

        return {"success": True, "message": "Article deleted successfully", "data": {}}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{article_id}/submit")
def submit_article(
    article_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        article = db.query(models.Article).filter(models.Article.id == article_id).first()
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")

        if article.author_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Access denied")

        if article.status != "draft":
            raise HTTPException(status_code=400, detail="Only draft articles can be submitted")

        article.status = "pending"
        db.commit()

        return {"success": True, "message": "Article submitted for review", "data": {"status": "pending"}}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{article_id}/approve")
def approve_article(
    article_id: int,
    request: schemas.ApprovalAction,
    current_user: models.User = Depends(require_roles("admin", "reviewer")),
    db: Session = Depends(get_db)
):
    try:
        article = db.query(models.Article).filter(models.Article.id == article_id).first()
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")

        if article.status != "pending":
            raise HTTPException(status_code=400, detail="Only pending articles can be approved")

        article.status = "approved"

        workflow = models.ApprovalWorkflow(
            article_id=article.id,
            reviewer_id=current_user.id,
            action="approved",
            comments=request.comments
        )
        db.add(workflow)
        db.commit()

        return {"success": True, "message": "Article approved", "data": {"status": "approved"}}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{article_id}/reject")
def reject_article(
    article_id: int,
    request: schemas.ApprovalAction,
    current_user: models.User = Depends(require_roles("admin", "reviewer")),
    db: Session = Depends(get_db)
):
    try:
        article = db.query(models.Article).filter(models.Article.id == article_id).first()
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")

        if article.status != "pending":
            raise HTTPException(status_code=400, detail="Only pending articles can be rejected")

        article.status = "rejected"

        workflow = models.ApprovalWorkflow(
            article_id=article.id,
            reviewer_id=current_user.id,
            action="rejected",
            comments=request.comments
        )
        db.add(workflow)
        db.commit()

        return {"success": True, "message": "Article rejected", "data": {"status": "rejected"}}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{article_id}/archive")
def archive_article(
    article_id: int,
    current_user: models.User = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    try:
        article = db.query(models.Article).filter(models.Article.id == article_id).first()
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")

        article.status = "archived"
        db.commit()

        return {"success": True, "message": "Article archived", "data": {"status": "archived"}}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
