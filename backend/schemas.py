from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    admin = "admin"
    author = "author"
    reviewer = "reviewer"
    employee = "employee"


class ArticleStatus(str, Enum):
    draft = "draft"
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    archived = "archived"


# Auth schemas
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None


class TagOut(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class CategoryOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    created_at: datetime
    article_count: Optional[int] = 0

    model_config = {"from_attributes": True}


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ArticleOut(BaseModel):
    id: int
    title: str
    content: str
    summary: Optional[str] = None
    category_id: Optional[int] = None
    author_id: int
    status: str
    view_count: int
    created_at: datetime
    updated_at: datetime
    author_name: Optional[str] = None
    category_name: Optional[str] = None
    tags: Optional[List[TagOut]] = []
    avg_rating: Optional[float] = None

    model_config = {"from_attributes": True}


class ArticleCreate(BaseModel):
    title: str
    content: str
    summary: Optional[str] = None
    category_id: Optional[int] = None
    tag_ids: Optional[List[int]] = []


class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    category_id: Optional[int] = None
    tag_ids: Optional[List[int]] = None


class CommentOut(BaseModel):
    id: int
    article_id: int
    user_id: int
    comment_text: str
    created_at: datetime
    user_name: Optional[str] = None

    model_config = {"from_attributes": True}


class CommentCreate(BaseModel):
    comment_text: str


class RatingCreate(BaseModel):
    rating: int

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v):
        if v < 1 or v > 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class RatingOut(BaseModel):
    avg_rating: Optional[float] = None
    user_rating: Optional[int] = None
    total_ratings: int = 0


class AttachmentOut(BaseModel):
    id: int
    article_id: int
    filename: str
    original_name: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class ApprovalAction(BaseModel):
    comments: Optional[str] = None


class UpdateRoleRequest(BaseModel):
    role: UserRole


class UpdateStatusRequest(BaseModel):
    is_active: bool


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None


class TagCreate(BaseModel):
    name: str


class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None


class PaginatedResponse(BaseModel):
    success: bool
    message: str
    data: dict
