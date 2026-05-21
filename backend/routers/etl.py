import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
import models
from auth import require_roles
from etl.pipeline import ETLPipeline
from etl.sample_data_generator import generate_sample_csv

router = APIRouter()

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("/import")
async def import_file(
    file: UploadFile = File(...),
    current_user: models.User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith((".csv", ".json")):
        raise HTTPException(status_code=400, detail="Only CSV and JSON files are supported")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 50MB limit")

    try:
        pipeline = ETLPipeline(db)
        result = pipeline.run(file_bytes, file.filename, job_name=file.filename)
        return {
            "success": True,
            "message": f"Import completed: {result['success_count']} records imported",
            "data": {
                "job_id": result["job_id"],
                "status": result["status"],
                "total_records": result["total_records"],
                "success_count": result["success_count"],
                "failed_count": result["failed_count"],
                "errors": result["errors"][:20],
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs")
def list_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: models.User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * limit
    rows = db.execute(text("""
        SELECT id, job_name, source_file, status, total_records, success_count,
               failed_count, started_at, completed_at,
               TIMESTAMPDIFF(SECOND, started_at, IFNULL(completed_at, NOW())) AS duration_seconds
        FROM etl_job_logs
        ORDER BY started_at DESC
        LIMIT :limit OFFSET :offset
    """), {"limit": limit, "offset": offset}).fetchall()

    total = db.execute(text("SELECT COUNT(*) FROM etl_job_logs")).scalar()

    jobs = []
    for r in rows:
        jobs.append({
            "id": r.id,
            "job_name": r.job_name,
            "source_file": r.source_file,
            "status": r.status,
            "total_records": r.total_records,
            "success_count": r.success_count,
            "failed_count": r.failed_count,
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "duration_seconds": r.duration_seconds,
        })

    return {
        "success": True,
        "message": "ETL jobs retrieved",
        "data": {
            "jobs": jobs,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit,
        },
    }


@router.get("/jobs/{job_id}")
def get_job(
    job_id: int,
    current_user: models.User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    row = db.execute(text("""
        SELECT id, job_name, source_file, status, total_records, success_count,
               failed_count, error_log, started_at, completed_at,
               TIMESTAMPDIFF(SECOND, started_at, IFNULL(completed_at, NOW())) AS duration_seconds
        FROM etl_job_logs WHERE id = :id
    """), {"id": job_id}).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "success": True,
        "message": "Job retrieved",
        "data": {
            "id": row.id,
            "job_name": row.job_name,
            "source_file": row.source_file,
            "status": row.status,
            "total_records": row.total_records,
            "success_count": row.success_count,
            "failed_count": row.failed_count,
            "error_log": row.error_log,
            "started_at": row.started_at.isoformat() if row.started_at else None,
            "completed_at": row.completed_at.isoformat() if row.completed_at else None,
            "duration_seconds": row.duration_seconds,
        },
    }


@router.post("/generate-sample")
def generate_sample(
    current_user: models.User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    csv_path = "sample_data/articles.csv"
    try:
        csv_out, json_out = generate_sample_csv(csv_path, 120)
        return {
            "success": True,
            "message": "Sample data generated successfully",
            "data": {
                "csv_path": csv_out,
                "json_path": json_out,
                "record_count": 120,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sample/download/{fmt}")
def download_sample(
    fmt: str,
    current_user: models.User = Depends(require_roles("admin")),
):
    if fmt not in ("csv", "json"):
        raise HTTPException(status_code=400, detail="Format must be 'csv' or 'json'")

    file_path = f"sample_data/articles.{fmt}"
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="Sample not generated yet. Call /generate-sample first.",
        )

    media_type = "text/csv" if fmt == "csv" else "application/json"
    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=f"articles.{fmt}",
    )
