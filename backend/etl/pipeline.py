from datetime import datetime
from sqlalchemy import text
from etl.extractor import ArticleExtractor
from etl.transformer import ArticleTransformer
from etl.loader import ArticleLoader


class ETLPipeline:
    def __init__(self, db):
        self.extractor = ArticleExtractor()
        self.transformer = ArticleTransformer()
        self.loader = ArticleLoader()
        self.db = db

    def run(self, file_bytes: bytes, filename: str, job_name: str) -> dict:
        db = self.db

        # Create job log entry
        result = db.execute(text("""
            INSERT INTO etl_job_logs (job_name, source_file, status, started_at)
            VALUES (:job_name, :source_file, 'running', :started_at)
        """), {"job_name": job_name, "source_file": filename, "started_at": datetime.now()})
        db.commit()
        job_id = result.lastrowid

        try:
            raw_records = self.extractor.extract_from_upload(file_bytes, filename)
            total_records = len(raw_records)

            db.execute(text("UPDATE etl_job_logs SET total_records = :tr WHERE id = :jid"),
                       {"tr": total_records, "jid": job_id})
            db.commit()

            transformed, transform_errors = self.transformer.transform(raw_records, db)
            load_result = self.loader.load(transformed, db, job_id)

            all_errors = transform_errors + load_result["errors"]

            return {
                "job_id": job_id,
                "status": "completed",
                "total_records": total_records,
                "success_count": load_result["success_count"],
                "failed_count": load_result["failed_count"] + len(transform_errors),
                "errors": all_errors,
            }

        except Exception as e:
            try:
                db.execute(text("""
                    UPDATE etl_job_logs
                    SET status = 'failed', error_log = :err, completed_at = :now
                    WHERE id = :jid
                """), {"err": str(e), "now": datetime.now(), "jid": job_id})
                db.commit()
            except Exception:
                db.rollback()
            raise
