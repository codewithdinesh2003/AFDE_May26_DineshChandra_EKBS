from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models, schemas
from auth import get_current_user, require_roles

router = APIRouter()


@router.get("")
def list_categories(db: Session = Depends(get_db)):
    try:
        categories = db.query(models.Category).all()
        result = []
        for cat in categories:
            count = db.query(func.count(models.Article.id)).filter(
                models.Article.category_id == cat.id,
                models.Article.status == "approved"
            ).scalar()
            result.append({
                "id": cat.id,
                "name": cat.name,
                "description": cat.description,
                "parent_id": cat.parent_id,
                "created_at": cat.created_at.isoformat(),
                "article_count": count
            })

        return {"success": True, "message": "Categories retrieved", "data": {"categories": result}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
def create_category(
    request: schemas.CategoryCreate,
    current_user: models.User = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    try:
        existing = db.query(models.Category).filter(models.Category.name == request.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Category already exists")

        cat = models.Category(
            name=request.name,
            description=request.description,
            parent_id=request.parent_id
        )
        db.add(cat)
        db.commit()
        db.refresh(cat)

        return {
            "success": True,
            "message": "Category created",
            "data": {
                "id": cat.id,
                "name": cat.name,
                "description": cat.description,
                "parent_id": cat.parent_id,
                "created_at": cat.created_at.isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{category_id}")
def update_category(
    category_id: int,
    request: schemas.CategoryCreate,
    current_user: models.User = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    try:
        cat = db.query(models.Category).filter(models.Category.id == category_id).first()
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")

        cat.name = request.name
        if request.description is not None:
            cat.description = request.description
        if request.parent_id is not None:
            cat.parent_id = request.parent_id

        db.commit()
        db.refresh(cat)

        return {
            "success": True,
            "message": "Category updated",
            "data": {"id": cat.id, "name": cat.name, "description": cat.description}
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    current_user: models.User = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    try:
        cat = db.query(models.Category).filter(models.Category.id == category_id).first()
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")

        db.delete(cat)
        db.commit()

        return {"success": True, "message": "Category deleted", "data": {}}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
