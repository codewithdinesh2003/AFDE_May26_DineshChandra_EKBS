# Enterprise Knowledge Base Management System (EKBMS)

A full-stack enterprise-grade knowledge base platform enabling organizations to create, manage, review, and publish internal knowledge articles with role-based access control.

## Features

- **Role-Based Access Control** — Admin, Author, Reviewer, and Employee roles with granular permissions
- **Article Lifecycle Management** — Draft → Pending → Approved/Rejected workflow with reviewer approval
- **Full-Text Search** — MySQL FULLTEXT search across article titles and content
- **Category & Tag Taxonomy** — Hierarchical categories and tag-based filtering
- **Ratings & Comments** — Community feedback system with 5-star ratings and threaded comments
- **Bookmarks** — Personal article bookmarking per user
- **File Attachments** — Upload and download PDF, Word, Excel, PowerPoint, and image files (10MB max)
- **Analytics Dashboard** — Article statistics, category breakdowns, top-viewed, and top-rated articles
- **JWT Authentication** — Secure token-based authentication with 24-hour expiry
- **Responsive UI** — CSS Grid/Flexbox layout working on desktop and mobile

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18, React Router v6, Axios, Vite  |
| Backend   | FastAPI (Python), SQLAlchemy ORM        |
| Database  | MySQL 8.0                               |
| Auth      | JWT (python-jose), bcrypt (passlib)     |
| Tools     | PyMySQL, python-dotenv, aiofiles        |

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **MySQL** 8.0+

## Setup Instructions

### Step 1: Clone the Repository

```bash
git clone <repo-url>
cd enterprise-knowledge-base-system
```

### Step 2: MySQL Database Setup

```sql
-- Connect to MySQL and run:
source database/schema.sql
```

Or using the CLI:
```bash
mysql -u root -p < database/schema.sql
```

### Step 3: Backend Setup

```bash
cd backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r ../requirements.txt

# Configure environment (edit .env as needed)
# Default .env is pre-configured for localhost MySQL

# Start the backend server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
Interactive docs: `http://localhost:8000/docs`

> **Note:** The database seeds automatically on first startup when the users table is empty.

### Step 4: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`

## Default Login Credentials

| Role     | Email                  | Password    |
|----------|------------------------|-------------|
| Admin    | admin@ekbms.com        | admin123    |
| Author   | author@ekbms.com       | author123   |
| Reviewer | reviewer@ekbms.com     | reviewer123 |
| Employee | employee@ekbms.com     | employee123 |

## API Endpoints Quick Reference

| Method | Endpoint                          | Description                  | Auth Required |
|--------|-----------------------------------|------------------------------|---------------|
| POST   | /api/auth/register                | Register user                | No            |
| POST   | /api/auth/login                   | Login                        | No            |
| GET    | /api/auth/me                      | Get current user             | Yes           |
| GET    | /api/articles                     | List approved articles       | No            |
| POST   | /api/articles                     | Create article               | Author/Admin  |
| GET    | /api/articles/{id}                | Get article                  | No            |
| PUT    | /api/articles/{id}                | Update article               | Author/Admin  |
| DELETE | /api/articles/{id}                | Delete article               | Author/Admin  |
| POST   | /api/articles/{id}/submit         | Submit for review            | Author        |
| POST   | /api/articles/{id}/approve        | Approve article              | Reviewer/Admin|
| POST   | /api/articles/{id}/reject         | Reject article               | Reviewer/Admin|
| GET    | /api/categories                   | List categories              | No            |
| POST   | /api/categories                   | Create category              | Admin         |
| GET    | /api/tags                         | List tags                    | No            |
| GET    | /api/search                       | Search articles              | No            |
| POST   | /api/articles/{id}/rate           | Rate article                 | Yes           |
| POST   | /api/bookmarks/{id}               | Toggle bookmark              | Yes           |
| GET    | /api/bookmarks                    | My bookmarks                 | Yes           |
| GET    | /api/users                        | List users                   | Admin         |
| GET    | /api/analytics/dashboard          | Dashboard stats              | Admin/Reviewer|

## Project Structure

```
enterprise-knowledge-base-system/
├── frontend/                    # React.js application
│   ├── src/
│   │   ├── api/api.js           # Axios API client
│   │   ├── context/AuthContext  # Authentication state
│   │   ├── components/          # Reusable UI components
│   │   └── pages/               # Route page components
│   ├── package.json
│   └── vite.config.js
├── backend/                     # FastAPI application
│   ├── main.py                  # App entry point
│   ├── database.py              # Database connection
│   ├── models.py                # SQLAlchemy ORM models
│   ├── schemas.py               # Pydantic schemas
│   ├── auth.py                  # JWT authentication
│   ├── seed.py                  # Database seeder
│   ├── .env                     # Environment config
│   └── routers/                 # API route handlers
│       ├── auth.py
│       ├── articles.py
│       ├── categories.py
│       ├── tags.py
│       ├── search.py
│       ├── comments.py
│       ├── ratings.py
│       ├── bookmarks.py
│       ├── attachments.py
│       ├── users.py
│       └── analytics.py
├── database/
│   ├── schema.sql               # Database schema
│   └── seed.sql                 # Reference seed data
├── docs/
│   └── API_DOCUMENTATION.md    # Full API reference
├── screenshots/                 # Application screenshots
├── requirements.txt             # Python dependencies
├── .gitignore
└── README.md
```

## Screenshots

- Login Page
  <img width="1919" height="881" alt="image" src="https://github.com/user-attachments/assets/5a9d0a85-88bd-4f3f-b807-2370fcd040e5" />
- Dashboard Page
  <img width="1919" height="897" alt="image" src="https://github.com/user-attachments/assets/39b1f205-7a03-4616-bafd-def33b15a6f6" />
- Articles
<img width="1919" height="889" alt="image" src="https://github.com/user-attachments/assets/90d1943f-e0f4-4a37-9f06-cee47e615ed9" />
- article view
<img width="1919" height="949" alt="image" src="https://github.com/user-attachments/assets/f9f4d10b-ddc1-4da3-b858-741ca84e51e5" />
- analytics 
<img width="1919" height="873" alt="image" src="https://github.com/user-attachments/assets/20e3800b-5710-4b06-9309-b45abd818a16" />
- approval queue
<img width="1919" height="896" alt="image" src="https://github.com/user-attachments/assets/daa108bf-27dd-4121-99fe-d267f2945b09" />



  
| Page            | Description                              |
|-----------------|------------------------------------------|
| Login           | Authentication page with demo credentials |
| Article List    | Browse articles with category/tag filters |
| Article View    | Full article with ratings and comments   |
| Approval Queue  | Reviewer workflow for pending articles   |
| Analytics       | Dashboard with charts and statistics     |


## Phase 2 - ETL Pipeline & Analytics

### New Features
- Bulk import articles from CSV or JSON (up to 120+ articles at once)
- ETL pipeline with extract, transform, and load stages
- Auto-creates categories and tags that don't exist
- Duplicate detection during import
- Per-record error handling (one failure won't stop the import)
- Search keyword tracking and analytics
- Daily article view tracking
- Author activity statistics
- Category trend reports
- CSV export for all reports

### Phase 2 Tech Additions
| Component | Technology |
|-----------|------------|
| ETL Pipeline | Python (custom, no frameworks) |
| Analytics Tables | MySQL (article_analytics, search_logs, author_stats, category_trends) |
| Sample Data | 120 pre-generated articles across 6 categories |
| Charts | Pure SVG (no chart libraries) |
| CSV Export | Python csv + StreamingResponse |

### New API Endpoints (Phase 2)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/etl/import | Import CSV or JSON file |
| GET | /api/etl/jobs | List ETL job history |
| GET | /api/etl/jobs/{id} | Get job detail + errors |
| POST | /api/etl/generate-sample | Generate 120 sample articles |
| GET | /api/etl/sample/download/{format} | Download sample CSV/JSON |
| GET | /api/analytics/trends | Category and view trends |
| GET | /api/analytics/keywords | Search keyword analysis |
| GET | /api/analytics/authors | Author activity report |
| GET | /api/analytics/export | Download CSV reports |

### CSV Import Format
| Column | Required | Format | Notes |
|--------|----------|--------|-------|
| title | Yes | text | Max 255 chars |
| content | Yes | text | Min 50 chars |
| summary | No | text | Auto-generated if missing |
| category | Yes | text | Created automatically if new |
| tags | No | comma-separated | Created automatically if new |
| author_email | No | email | Falls back to admin if not found |
| views | No | integer | Defaults to 0 |
| status | No | approved/draft/pending | Defaults to draft |
| created_at | No | YYYY-MM-DD | Defaults to today |

### How to Run ETL Import
1. Start backend: `cd backend && uvicorn main:app --reload`
2. Login as admin (admin@ekbms.com / admin123)
3. Navigate to /etl-import
4. Click "Generate Sample Data" to create 120 sample articles
5. Download the CSV, then re-upload it to test the pipeline
6. View import results and job history

### Frontend Pages (Phase 2)
| Route | Access | Description |
|-------|--------|-------------|
| /etl-import | Admin only | Bulk import CSV/JSON + job history |
| /analytics | All roles | Enhanced 5-tab analytics dashboard |

### Chart Components (Pure SVG - No Libraries)
- LineChart.jsx - Daily views and trend lines
- BarChart.jsx - Keyword frequency and volume
- HorizontalBar.jsx - Status distribution and category breakdowns

---

## License

MIT
