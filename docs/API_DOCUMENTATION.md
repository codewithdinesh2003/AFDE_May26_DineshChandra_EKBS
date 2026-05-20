# EKBMS API Documentation

Base URL: `http://localhost:8000`

All responses follow this envelope format:
```json
{
  "success": true,
  "message": "Description",
  "data": {}
}
```

Authentication uses Bearer tokens: `Authorization: Bearer <token>`

---

## Authentication

### POST /api/auth/register
Register a new user account (default role: employee).

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "eyJ...",
    "user": { "id": 5, "name": "John Doe", "email": "john@example.com", "role": "employee" }
  }
}
```

**Error Responses:** 400 (email already registered), 422 (validation error)

---

### POST /api/auth/login
Login and obtain a JWT token valid for 24 hours.

**Request Body:**
```json
{ "email": "admin@ekbms.com", "password": "admin123" }
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJ...",
    "user": { "id": 1, "name": "Admin User", "email": "admin@ekbms.com", "role": "admin", "is_active": true }
  }
}
```

**Error Responses:** 401 (invalid credentials), 403 (account deactivated)

---

### GET /api/auth/me
Get current authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "User profile retrieved",
  "data": { "id": 1, "name": "Admin User", "email": "admin@ekbms.com", "role": "admin", "is_active": true, "created_at": "2024-01-01T00:00:00" }
}
```

**Error Responses:** 401 (invalid/expired token)

---

### PUT /api/auth/profile
Update name and/or password for current user.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{ "name": "New Name", "password": "newpassword123" }
```

**Success Response (200):**
```json
{ "success": true, "message": "Profile updated successfully", "data": { "id": 1, "name": "New Name", "email": "admin@ekbms.com", "role": "admin" } }
```

---

## Articles

### GET /api/articles
List approved articles with pagination and filtering.

**Query Parameters:**
- `page` (int, default 1)
- `limit` (int, default 10, max 100)
- `category_id` (int, optional)
- `tag` (string, optional)
- `status` (string, optional — admin/reviewer only)
- `sort` (string: `latest` | `popular`, default `latest`)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Articles retrieved",
  "data": {
    "articles": [{ "id": 1, "title": "...", "summary": "...", "status": "approved", "view_count": 42, "author_name": "John", "category_name": "IT Support", "tags": [{"id": 1, "name": "guide"}], "avg_rating": 4.2 }],
    "total": 50,
    "page": 1,
    "limit": 10,
    "total_pages": 5
  }
}
```

---

### POST /api/articles
Create a new article (saved as draft).

**Required Role:** author, admin
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{ "title": "My Article", "content": "Full content here...", "summary": "Brief description", "category_id": 1, "tag_ids": [1, 3] }
```

**Success Response (200):**
```json
{ "success": true, "message": "Article created successfully", "data": { "id": 10, "title": "My Article", "status": "draft", ... } }
```

**Error Responses:** 401, 403 (insufficient role)

---

### GET /api/articles/my
Get current user's own articles (all statuses).

**Required:** Authenticated
**Headers:** `Authorization: Bearer <token>`
**Query Parameters:** `page`, `limit`

---

### GET /api/articles/pending
Get articles pending review.

**Required Role:** reviewer, admin
**Headers:** `Authorization: Bearer <token>`

---

### GET /api/articles/{id}
Get a single article by ID. Increments view_count on each call. Drafts/pending only accessible to author and admin.

**Query Parameters:** none

**Success Response (200):** Full article object with tags, author_name, category_name, avg_rating.

**Error Responses:** 403 (access denied for non-approved), 404 (not found)

---

### PUT /api/articles/{id}
Update article fields.

**Required:** Author (own article) or Admin
**Headers:** `Authorization: Bearer <token>`

**Request Body (all optional):**
```json
{ "title": "Updated Title", "content": "...", "summary": "...", "category_id": 2, "tag_ids": [1, 2] }
```

---

### DELETE /api/articles/{id}
Delete an article and all its attachments, comments, ratings, bookmarks.

**Required:** Author (own article) or Admin
**Headers:** `Authorization: Bearer <token>`

---

### POST /api/articles/{id}/submit
Change article status from draft to pending.

**Required:** Author (own article) or Admin

**Error Responses:** 400 (not a draft)

---

### POST /api/articles/{id}/approve
Approve a pending article.

**Required Role:** reviewer, admin

**Request Body:**
```json
{ "comments": "Looks great, approved!" }
```

**Error Responses:** 400 (not pending)

---

### POST /api/articles/{id}/reject
Reject a pending article with feedback.

**Required Role:** reviewer, admin

**Request Body:**
```json
{ "comments": "Needs more detail in section 3" }
```

---

### POST /api/articles/{id}/archive
Archive an approved article.

**Required Role:** admin

---

## Categories

### GET /api/categories
List all categories with article count. Public endpoint.

**Success Response:**
```json
{ "success": true, "data": { "categories": [{ "id": 1, "name": "IT Support", "description": "...", "parent_id": null, "article_count": 12 }] } }
```

---

### POST /api/categories
Create a new category.

**Required Role:** admin

**Request Body:**
```json
{ "name": "New Category", "description": "Optional description", "parent_id": null }
```

---

### PUT /api/categories/{id}
Update a category.

**Required Role:** admin

---

### DELETE /api/categories/{id}
Delete a category (articles lose their category reference).

**Required Role:** admin

---

## Tags

### GET /api/tags
List all tags with usage count. Public endpoint.

**Success Response:**
```json
{ "success": true, "data": { "tags": [{ "id": 1, "name": "guide", "usage_count": 8 }] } }
```

---

### POST /api/tags
Create a new tag.

**Required Role:** author, admin

**Request Body:**
```json
{ "name": "new-tag" }
```

---

### DELETE /api/tags/{id}
Delete a tag (removes from all articles).

**Required Role:** admin

---

## Search

### GET /api/search
Search approved articles by keyword.

**Query Parameters:**
- `q` (string) — search keyword
- `category_id` (int, optional)
- `tag` (string, optional)
- `author_id` (int, optional)
- `sort` (string: `latest` | `popular`)
- `page`, `limit`

**Success Response:**
```json
{
  "success": true,
  "data": {
    "articles": [...],
    "total_count": 15,
    "page": 1,
    "limit": 10,
    "total_pages": 2,
    "query": "password reset"
  }
}
```

---

## Comments

### GET /api/articles/{id}/comments
Get all comments for an article.

**Success Response:**
```json
{ "data": { "comments": [{ "id": 1, "user_name": "John", "comment_text": "...", "created_at": "..." }] } }
```

---

### POST /api/articles/{id}/comments
Add a comment.

**Required:** Authenticated

**Request Body:**
```json
{ "comment_text": "Great article!" }
```

---

### DELETE /api/comments/{id}
Delete a comment.

**Required:** Comment owner or Admin

**Error Responses:** 403 (not owner/admin), 404

---

## Ratings

### POST /api/articles/{id}/rate
Rate an article (1–5). Upserts (updates if already rated).

**Required:** Authenticated

**Request Body:**
```json
{ "rating": 4 }
```

**Success Response:**
```json
{ "data": { "avg_rating": 4.2, "user_rating": 4 } }
```

**Error Responses:** 422 (rating out of range 1–5)

---

### GET /api/articles/{id}/rating
Get average rating and the current user's rating.

**Success Response:**
```json
{ "data": { "avg_rating": 4.2, "total_ratings": 15, "user_rating": 4 } }
```

---

## Bookmarks

### POST /api/bookmarks/{article_id}
Toggle bookmark — adds if not bookmarked, removes if bookmarked.

**Required:** Authenticated

**Success Response:**
```json
{ "message": "Bookmark added", "data": { "bookmarked": true } }
```

---

### GET /api/bookmarks
Get all bookmarked articles for current user.

**Required:** Authenticated

**Success Response:**
```json
{ "data": { "bookmarks": [{ "bookmark_id": 1, "article": {...}, "bookmarked_at": "..." }] } }
```

---

## File Attachments

### POST /api/articles/{id}/attachments
Upload a file attachment.

**Required:** Author (own article) or Admin
**Content-Type:** `multipart/form-data`
**Field:** `file`

**Constraints:** Max 10MB, allowed types: pdf, doc, docx, ppt, pptx, xls, xlsx, png, jpg, jpeg

**Success Response:**
```json
{ "data": { "id": 1, "original_name": "report.pdf", "file_size": 204800, "file_type": "pdf" } }
```

**Error Responses:** 400 (invalid type or size), 403

---

### GET /api/articles/{id}/attachments
List all attachments for an article.

---

### DELETE /api/attachments/{id}
Delete an attachment and its file from disk.

**Required:** Author (own article) or Admin

---

### GET /api/attachments/{id}/download
Download an attachment file.

**Response:** Binary file stream with `Content-Disposition: attachment`

---

## Users (Admin Only)

### GET /api/users
List all users with pagination.

**Required Role:** admin
**Query Parameters:** `page`, `limit`

**Success Response:**
```json
{ "data": { "users": [{ "id": 1, "name": "Admin", "email": "...", "role": "admin", "is_active": true }], "total": 4 } }
```

---

### PUT /api/users/{id}/role
Change a user's role.

**Required Role:** admin

**Request Body:**
```json
{ "role": "author" }
```

Valid roles: `admin`, `author`, `reviewer`, `employee`

---

### PUT /api/users/{id}/status
Activate or deactivate a user account.

**Required Role:** admin

**Request Body:**
```json
{ "is_active": false }
```

---

## Analytics

### GET /api/analytics/dashboard
Retrieve full dashboard statistics.

**Required Role:** admin, reviewer

**Success Response:**
```json
{
  "success": true,
  "data": {
    "total_articles": 25,
    "approved_articles": 15,
    "pending_articles": 3,
    "draft_articles": 5,
    "total_users": 10,
    "total_categories": 6,
    "total_tags": 10,
    "most_viewed": [{ "id": 1, "title": "...", "view_count": 421 }],
    "recent_articles": [{ "id": 8, "title": "...", "status": "approved", "created_at": "..." }],
    "articles_by_status": { "draft": 5, "pending": 3, "approved": 15, "rejected": 1, "archived": 1 },
    "articles_by_category": [{ "category_name": "IT Support", "count": 5 }],
    "top_rated": [{ "id": 3, "title": "...", "avg_rating": 4.8 }]
  }
}
```
