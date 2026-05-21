import csv
import json
import os
import tempfile


class ArticleExtractor:
    def extract_from_csv(self, file_path: str) -> list:
        records = []
        skipped = 0
        with open(file_path, newline="", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                title = (row.get("title") or "").strip()
                content = (row.get("content") or "").strip()
                if not title or not content:
                    skipped += 1
                    continue
                records.append(dict(row))
        if skipped:
            print(f"[Extractor] Skipped {skipped} rows with empty title/content")
        return records

    def extract_from_json(self, file_path: str) -> list:
        records = []
        skipped = 0
        with open(file_path, encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict):
            data = data.get("articles", [])
        for item in data:
            title = (item.get("title") or "").strip()
            content = (item.get("content") or "").strip()
            if not title or not content:
                skipped += 1
                continue
            records.append(item)
        if skipped:
            print(f"[Extractor] Skipped {skipped} records with empty title/content")
        return records

    def extract_from_upload(self, file_bytes: bytes, filename: str) -> list:
        ext = os.path.splitext(filename)[1].lower()
        suffix = ext if ext in (".csv", ".json") else ".tmp"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        try:
            if ext == ".csv":
                return self.extract_from_csv(tmp_path)
            elif ext == ".json":
                return self.extract_from_json(tmp_path)
            else:
                raise ValueError(f"Unsupported file type: {ext}")
        finally:
            os.unlink(tmp_path)
