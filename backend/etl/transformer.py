from datetime import datetime
import models


class ArticleTransformer:
    def transform(self, raw_records: list, db) -> tuple:
        transformed = []
        errors = []

        for i, raw in enumerate(raw_records):
            record_id = f"Row {i + 1}"
            try:
                # 1. TITLE
                title = (raw.get("title") or "").strip()[:255]
                if not title:
                    errors.append(f"{record_id}: empty title — skipped")
                    continue

                # 2. CONTENT
                content = (raw.get("content") or "").strip()
                if len(content) < 50:
                    errors.append(f"{record_id} '{title}': content too short (< 50 chars) — skipped")
                    continue

                # 3. SUMMARY
                summary_raw = (raw.get("summary") or "").strip()
                summary = summary_raw[:500] if summary_raw else content[:200]

                # 4. CATEGORY
                cat_name = (raw.get("category") or "General").strip().title()
                category = db.query(models.Category).filter(
                    models.Category.name == cat_name
                ).first()
                if not category:
                    category = models.Category(name=cat_name)
                    db.add(category)
                    db.flush()
                category_id = category.id

                # 5. TAGS
                tags_raw = (raw.get("tags") or "").strip()
                tag_ids = []
                if tags_raw:
                    for tag_name in [t.strip().lower() for t in tags_raw.split(",") if t.strip()]:
                        tag = db.query(models.Tag).filter(models.Tag.name == tag_name).first()
                        if not tag:
                            tag = models.Tag(name=tag_name)
                            db.add(tag)
                            db.flush()
                        tag_ids.append(tag.id)

                # 6. AUTHOR
                author_email = (raw.get("author_email") or "").strip()
                author = None
                if author_email:
                    author = db.query(models.User).filter(
                        models.User.email == author_email
                    ).first()
                if not author:
                    author = db.query(models.User).filter(
                        models.User.role == "admin"
                    ).first()
                author_id = author.id if author else None

                # 7. STATUS
                status_map = {"published": "approved"}
                raw_status = (raw.get("status") or "draft").strip().lower()
                status = status_map.get(raw_status, raw_status)
                if status not in ("approved", "draft", "pending"):
                    status = "draft"

                # 8. VIEWS
                try:
                    views = int(raw.get("views", 0) or 0)
                except (ValueError, TypeError):
                    views = 0

                # 9. CREATED_AT
                created_at = None
                raw_date = (raw.get("created_at") or "").strip()
                for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
                    try:
                        created_at = datetime.strptime(raw_date, fmt)
                        break
                    except ValueError:
                        pass
                if not created_at:
                    created_at = datetime.now()

                # 10. DUPLICATE CHECK
                existing = db.query(models.Article).filter(
                    models.Article.title == title
                ).first()
                if existing:
                    errors.append(f"{record_id} '{title}': duplicate title — skipped")
                    continue

                transformed.append({
                    "title": title,
                    "content": content,
                    "summary": summary,
                    "category_id": category_id,
                    "tag_ids": tag_ids,
                    "author_id": author_id,
                    "status": status,
                    "views": views,
                    "created_at": created_at,
                })

            except Exception as e:
                errors.append(f"{record_id}: unexpected error — {str(e)}")

        return transformed, errors
