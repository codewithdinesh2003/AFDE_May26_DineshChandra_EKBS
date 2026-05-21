from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, Enum, ForeignKey,
    SmallInteger, UniqueConstraint, Index, Date, DECIMAL
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum("admin", "author", "reviewer", "employee"), default="employee")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())

    articles = relationship("Article", back_populates="author", foreign_keys="Article.author_id")
    comments = relationship("Comment", back_populates="user")
    ratings = relationship("Rating", back_populates="user")
    bookmarks = relationship("Bookmark", back_populates="user")
    reviews = relationship("ApprovalWorkflow", back_populates="reviewer")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    created_at = Column(DateTime, default=func.now())

    articles = relationship("Article", back_populates="category")
    children = relationship("Category", backref="parent", remote_side=[id])


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)

    article_tags = relationship("ArticleTag", back_populates="tag")


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    summary = Column(String(500))
    category_id = Column(Integer, ForeignKey("categories.id"))
    author_id = Column(Integer, ForeignKey("users.id"))
    status = Column(
        Enum("draft", "pending", "approved", "rejected", "archived"),
        default="draft"
    )
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    author = relationship("User", back_populates="articles", foreign_keys=[author_id])
    category = relationship("Category", back_populates="articles")
    article_tags = relationship("ArticleTag", back_populates="article", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="article", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="article", cascade="all, delete-orphan")
    ratings = relationship("Rating", back_populates="article", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="article", cascade="all, delete-orphan")
    workflows = relationship("ApprovalWorkflow", back_populates="article", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_articles_status", "status"),
        Index("idx_articles_category_id", "category_id"),
        Index("idx_articles_author_id", "author_id"),
    )


class ArticleTag(Base):
    __tablename__ = "article_tags"

    article_id = Column(Integer, ForeignKey("articles.id", ondelete="CASCADE"), primary_key=True)
    article_tag_id = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)

    article = relationship("Article", back_populates="article_tags")
    tag = relationship("Tag", back_populates="article_tags")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    article_id = Column(Integer, ForeignKey("articles.id", ondelete="CASCADE"))
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_type = Column(String(50))
    file_size = Column(Integer)
    uploaded_at = Column(DateTime, default=func.now())

    article = relationship("Article", back_populates="attachments")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    article_id = Column(Integer, ForeignKey("articles.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id"))
    comment_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())

    article = relationship("Article", back_populates="comments")
    user = relationship("User", back_populates="comments")


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    article_id = Column(Integer, ForeignKey("articles.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id"))
    rating = Column(SmallInteger, nullable=False)
    created_at = Column(DateTime, default=func.now())

    article = relationship("Article", back_populates="ratings")
    user = relationship("User", back_populates="ratings")

    __table_args__ = (
        UniqueConstraint("article_id", "user_id", name="unique_rating"),
    )


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    article_id = Column(Integer, ForeignKey("articles.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())

    article = relationship("Article", back_populates="bookmarks")
    user = relationship("User", back_populates="bookmarks")

    __table_args__ = (
        UniqueConstraint("article_id", "user_id", name="unique_bookmark"),
    )


class ApprovalWorkflow(Base):
    __tablename__ = "approval_workflow"

    id = Column(Integer, primary_key=True, autoincrement=True)
    article_id = Column(Integer, ForeignKey("articles.id", ondelete="CASCADE"))
    reviewer_id = Column(Integer, ForeignKey("users.id"))
    action = Column(Enum("approved", "rejected"), nullable=False)
    comments = Column(Text)
    actioned_at = Column(DateTime, default=func.now())

    article = relationship("Article", back_populates="workflows")
    reviewer = relationship("User", back_populates="reviews")


# ─── Phase 2 Models ────────────────────────────────────────────────────────────

class ArticleAnalytics(Base):
    __tablename__ = "article_analytics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    article_id = Column(Integer, ForeignKey("articles.id", ondelete="CASCADE"), nullable=False)
    view_date = Column(Date, nullable=False)
    view_count = Column(Integer, default=1)

    __table_args__ = (
        UniqueConstraint("article_id", "view_date", name="unique_daily_view"),
    )


class SearchLog(Base):
    __tablename__ = "search_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    keyword = Column(String(255), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    results_count = Column(Integer, default=0)
    searched_at = Column(DateTime, default=func.now())


class CategoryTrend(Base):
    __tablename__ = "category_trends"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    week_start = Column(Date, nullable=False)
    article_count = Column(Integer, default=0)
    total_views = Column(Integer, default=0)

    __table_args__ = (
        UniqueConstraint("category_id", "week_start", name="unique_weekly_trend"),
    )


class AuthorStats(Base):
    __tablename__ = "author_stats"

    id = Column(Integer, primary_key=True, autoincrement=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    total_articles = Column(Integer, default=0)
    approved_articles = Column(Integer, default=0)
    pending_articles = Column(Integer, default=0)
    rejected_articles = Column(Integer, default=0)
    total_views = Column(Integer, default=0)
    avg_rating = Column(DECIMAL(3, 2), default=0.00)
    last_updated = Column(DateTime, default=func.now(), onupdate=func.now())


class ETLJobLog(Base):
    __tablename__ = "etl_job_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_name = Column(String(100), nullable=False)
    source_file = Column(String(255))
    status = Column(Enum("running", "completed", "failed"), default="running")
    total_records = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    error_log = Column(Text, nullable=True)
    started_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime, nullable=True)
