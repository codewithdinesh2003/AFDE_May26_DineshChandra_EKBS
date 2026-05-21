import csv
import io
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, text
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


def _period_days(period: str) -> int:
    return {"7d": 7, "30d": 30, "90d": 90}.get(period, 30)


@router.get("/trends")
def get_trends(
    period: str = Query("30d"),
    current_user: models.User = Depends(require_roles("admin", "reviewer")),
    db: Session = Depends(get_db),
):
    try:
        days = _period_days(period)

        cat_trends = db.execute(text("""
            SELECT c.id, c.name, ct.article_count, ct.total_views, ct.week_start
            FROM category_trends ct
            JOIN categories c ON c.id = ct.category_id
            ORDER BY ct.total_views DESC
        """)).fetchall()

        daily_views = db.execute(text("""
            SELECT view_date, SUM(view_count) AS total_views
            FROM article_analytics
            WHERE view_date >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
            GROUP BY view_date
            ORDER BY view_date ASC
        """), {"days": days}).fetchall()

        articles_this = db.execute(text("""
            SELECT COUNT(*) FROM articles
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
        """), {"days": days}).scalar() or 0

        articles_last = db.execute(text("""
            SELECT COUNT(*) FROM articles
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL :days2 DAY)
              AND created_at < DATE_SUB(NOW(), INTERVAL :days DAY)
        """), {"days": days, "days2": days * 2}).scalar() or 0

        growth = round((articles_this - articles_last) / max(articles_last, 1) * 100, 1)

        return {
            "success": True,
            "message": "Trends retrieved",
            "data": {
                "category_trends": [
                    {
                        "category_id": r.id,
                        "category_name": r.name,
                        "article_count": r.article_count,
                        "total_views": r.total_views,
                        "week_start": r.week_start.isoformat() if r.week_start else None,
                    }
                    for r in cat_trends
                ],
                "daily_views": [
                    {"view_date": r.view_date.isoformat(), "total_views": r.total_views}
                    for r in daily_views
                ],
                "growth": {
                    "articles_this_period": articles_this,
                    "articles_last_period": articles_last,
                    "growth_percentage": growth,
                },
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/keywords")
def get_keywords(
    limit: int = Query(20, ge=1, le=100),
    period: str = Query("30d"),
    current_user: models.User = Depends(require_roles("admin", "reviewer")),
    db: Session = Depends(get_db),
):
    try:
        days = _period_days(period)
        cutoff = datetime.now() - timedelta(days=days)

        top_keywords = db.execute(text("""
            SELECT keyword,
                   COUNT(*) AS search_count,
                   AVG(results_count) AS avg_results,
                   MAX(searched_at) AS last_searched_at
            FROM search_logs
            WHERE searched_at >= :cutoff AND keyword != ''
            GROUP BY keyword
            ORDER BY search_count DESC
            LIMIT :limit
        """), {"cutoff": cutoff, "limit": limit}).fetchall()

        zero_results = db.execute(text("""
            SELECT keyword,
                   COUNT(*) AS search_count,
                   AVG(results_count) AS avg_results,
                   MAX(searched_at) AS last_searched_at
            FROM search_logs
            WHERE searched_at >= :cutoff AND results_count = 0 AND keyword != ''
            GROUP BY keyword
            ORDER BY search_count DESC
            LIMIT :limit
        """), {"cutoff": cutoff, "limit": limit}).fetchall()

        volume_by_day = db.execute(text("""
            SELECT DATE(searched_at) AS date, COUNT(*) AS count
            FROM search_logs
            WHERE searched_at >= :cutoff
            GROUP BY DATE(searched_at)
            ORDER BY date ASC
        """), {"cutoff": cutoff}).fetchall()

        def kw_row(r):
            return {
                "keyword": r.keyword,
                "search_count": r.search_count,
                "avg_results": float(round(r.avg_results, 1)) if r.avg_results else 0,
                "last_searched_at": r.last_searched_at.isoformat() if r.last_searched_at else None,
            }

        return {
            "success": True,
            "message": "Keywords retrieved",
            "data": {
                "top_keywords": [kw_row(r) for r in top_keywords],
                "zero_result_searches": [kw_row(r) for r in zero_results],
                "search_volume_by_day": [
                    {"date": r.date.isoformat(), "count": r.count}
                    for r in volume_by_day
                ],
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/authors")
def get_authors(
    current_user: models.User = Depends(require_roles("admin", "reviewer")),
    db: Session = Depends(get_db),
):
    try:
        rows = db.execute(text("""
            SELECT u.id, u.name, u.email,
                   COALESCE(ast.total_articles, 0) AS total_articles,
                   COALESCE(ast.approved_articles, 0) AS approved_articles,
                   COALESCE(ast.pending_articles, 0) AS pending_articles,
                   COALESCE(ast.rejected_articles, 0) AS rejected_articles,
                   COALESCE(ast.total_views, 0) AS total_views,
                   COALESCE(ast.avg_rating, 0) AS avg_rating
            FROM users u
            LEFT JOIN author_stats ast ON ast.author_id = u.id
            WHERE u.role IN ('admin', 'author')
            ORDER BY COALESCE(ast.total_views, 0) DESC
        """)).fetchall()

        authors = []
        for r in rows:
            top_article = db.execute(text("""
                SELECT id, title, view_count FROM articles
                WHERE author_id = :aid
                ORDER BY view_count DESC LIMIT 1
            """), {"aid": r.id}).fetchone()

            authors.append({
                "id": r.id,
                "name": r.name,
                "email": r.email,
                "total_articles": r.total_articles,
                "approved_articles": r.approved_articles,
                "pending_articles": r.pending_articles,
                "rejected_articles": r.rejected_articles,
                "total_views": r.total_views,
                "avg_rating": float(r.avg_rating) if r.avg_rating else 0,
                "most_viewed_article": {
                    "id": top_article.id,
                    "title": top_article.title,
                    "view_count": top_article.view_count,
                } if top_article else None,
            })

        return {"success": True, "message": "Author stats retrieved", "data": {"authors": authors}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export")
def export_report(
    type: str = Query(...),
    format: str = Query("csv"),
    current_user: models.User = Depends(require_roles("admin", "reviewer")),
    db: Session = Depends(get_db),
):
    today = datetime.now().strftime("%Y%m%d")
    filename = f"{type}_report_{today}.csv"

    output = io.StringIO()
    writer = csv.writer(output)

    if type == "articles":
        writer.writerow(["id", "title", "category", "author_name", "status", "view_count", "avg_rating", "created_at"])
        rows = db.execute(text("""
            SELECT a.id, a.title, c.name AS category, u.name AS author_name,
                   a.status, a.view_count,
                   COALESCE(AVG(r.rating), 0) AS avg_rating,
                   a.created_at
            FROM articles a
            LEFT JOIN categories c ON c.id = a.category_id
            LEFT JOIN users u ON u.id = a.author_id
            LEFT JOIN ratings r ON r.article_id = a.id
            GROUP BY a.id
            ORDER BY a.created_at DESC
        """)).fetchall()
        for r in rows:
            writer.writerow([r.id, r.title, r.category, r.author_name, r.status,
                             r.view_count, round(float(r.avg_rating), 2) if r.avg_rating else 0,
                             r.created_at.isoformat() if r.created_at else ""])

    elif type == "keywords":
        writer.writerow(["keyword", "search_count", "avg_results", "last_searched_at"])
        rows = db.execute(text("""
            SELECT keyword, COUNT(*) AS search_count,
                   AVG(results_count) AS avg_results,
                   MAX(searched_at) AS last_searched_at
            FROM search_logs WHERE keyword != ''
            GROUP BY keyword ORDER BY search_count DESC
        """)).fetchall()
        for r in rows:
            writer.writerow([r.keyword, r.search_count,
                             round(float(r.avg_results), 1) if r.avg_results else 0,
                             r.last_searched_at.isoformat() if r.last_searched_at else ""])

    elif type == "authors":
        writer.writerow(["name", "email", "total_articles", "approved_articles", "total_views", "avg_rating"])
        rows = db.execute(text("""
            SELECT u.name, u.email,
                   COALESCE(ast.total_articles, 0),
                   COALESCE(ast.approved_articles, 0),
                   COALESCE(ast.total_views, 0),
                   COALESCE(ast.avg_rating, 0)
            FROM users u
            LEFT JOIN author_stats ast ON ast.author_id = u.id
            WHERE u.role IN ('admin','author')
            ORDER BY COALESCE(ast.total_views, 0) DESC
        """)).fetchall()
        for r in rows:
            writer.writerow(list(r))

    elif type == "category_trends":
        writer.writerow(["category_name", "week_start", "article_count", "total_views"])
        rows = db.execute(text("""
            SELECT c.name, ct.week_start, ct.article_count, ct.total_views
            FROM category_trends ct
            JOIN categories c ON c.id = ct.category_id
            ORDER BY ct.week_start DESC, ct.total_views DESC
        """)).fetchall()
        for r in rows:
            writer.writerow([r.name,
                             r.week_start.isoformat() if r.week_start else "",
                             r.article_count, r.total_views])
    else:
        raise HTTPException(status_code=400, detail="Invalid export type")

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
