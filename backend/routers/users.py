from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import require_roles

router = APIRouter()


@router.get("")
def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: models.User = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(models.User)
        total = query.count()
        users = query.offset((page - 1) * limit).limit(limit).all()

        return {
            "success": True,
            "message": "Users retrieved",
            "data": {
                "users": [
                    {
                        "id": u.id,
                        "name": u.name,
                        "email": u.email,
                        "role": u.role,
                        "is_active": u.is_active,
                        "created_at": u.created_at.isoformat()
                    }
                    for u in users
                ],
                "total": total,
                "page": page,
                "limit": limit,
                "total_pages": (total + limit - 1) // limit
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{user_id}/role")
def update_user_role(
    user_id: int,
    request: schemas.UpdateRoleRequest,
    current_user: models.User = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.role = request.role.value
        db.commit()

        return {
            "success": True,
            "message": "User role updated",
            "data": {"id": user.id, "name": user.name, "role": user.role}
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{user_id}/status")
def update_user_status(
    user_id: int,
    request: schemas.UpdateStatusRequest,
    current_user: models.User = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.is_active = request.is_active
        db.commit()

        return {
            "success": True,
            "message": "User status updated",
            "data": {"id": user.id, "name": user.name, "is_active": user.is_active}
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
