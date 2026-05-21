from datetime import datetime, date, timedelta
from sqlalchemy import text
import models


class ArticleLoader:
    def load(self, transformed_records: list, db, job_id: int) -> dict:
        success_count = 0
        failed_count = 0
        errors = []

        for record in transformed_records:
            try:
                article = models.Article(
                    title=record["title"],
                    content=record["content"],
                    summary=record["summary"],
                    category_id=record["category_id"],
                    author_id=record["author_id"],
                    status=record["status"],
                    view_count=record["views"],
                    created_at=record["created_at"],
                    updated_at=record["created_at"],
                )
                db.add(article)
                db.flush()

                for tag_id in record.get("tag_ids", []):
                    at = models.ArticleTag(article_id=article.id, article_tag_id=tag_id)
                    db.add(at)

                view_date = record["created_at"].date() if hasattr(record["created_at"], "date") else record["created_at"]
                db.execute(text("""
                    INSERT INTO article_analytics (article_id, view_date, view_count)
                    VALUES (:article_id, :view_date, :views)
                    ON DUPLICATE KEY UPDATE view_count = view_count + :views
                """), {"article_id": article.id, "view_date": view_date, "views": record["views"]})

                db.commit()
                success_count += 1

            except Exception as e:
                db.rollback()
                failed_count += 1
                errors.append(f"'{record.get('title', '?')}': {str(e)}")

        self.refresh_analytics(db)

        try:
            db.execute(text("""
                UPDATE etl_job_logs
                SET completed_at = :now, status = 'completed',
                    success_count = :sc, failed_count = :fc
                WHERE id = :job_id
            """), {
                "now": datetime.now(),
                "sc": success_count,
                "fc": failed_count,
                "job_id": job_id,
            })
            db.commit()
        except Exception:
            db.rollback()

        return {"success_count": success_count, "failed_count": failed_count, "errors": errors}

    def refresh_analytics(self, db):
        try:
            db.execute(text("""
                INSERT INTO author_stats
                    (author_id, total_articles, approved_articles, pending_articles,
                     rejected_articles, total_views, avg_rating)
                SELECT
                    a.author_id,
                    COUNT(a.id),
                    SUM(CASE WHEN a.status = 'approved' THEN 1 ELSE 0 END),
                    SUM(CASE WHEN a.status = 'pending'  THEN 1 ELSE 0 END),
                    SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END),
                    COALESCE(SUM(aa.view_count), 0),
                    COALESCE(AVG(r.rating), 0.00)
                FROM articles a
                LEFT JOIN article_analytics aa ON aa.article_id = a.id
                LEFT JOIN ratings r ON r.article_id = a.id
                WHERE a.author_id IS NOT NULL
                GROUP BY a.author_id
                ON DUPLICATE KEY UPDATE
                    total_articles    = VALUES(total_articles),
                    approved_articles = VALUES(approved_articles),
                    pending_articles  = VALUES(pending_articles),
                    rejected_articles = VALUES(rejected_articles),
                    total_views       = VALUES(total_views),
                    avg_rating        = VALUES(avg_rating),
                    last_updated      = NOW()
            """))

            today = date.today()
            week_start = today - timedelta(days=today.weekday())
            db.execute(text("""
                INSERT INTO category_trends (category_id, week_start, article_count, total_views)
                SELECT
                    a.category_id,
                    :week_start,
                    COUNT(a.id),
                    COALESCE(SUM(aa.view_count), 0)
                FROM articles a
                LEFT JOIN article_analytics aa ON aa.article_id = a.id
                WHERE a.category_id IS NOT NULL
                GROUP BY a.category_id
                ON DUPLICATE KEY UPDATE
                    article_count = VALUES(article_count),
                    total_views   = VALUES(total_views)
            """), {"week_start": week_start})

            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[Loader] refresh_analytics error: {e}")
