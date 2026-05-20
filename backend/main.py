import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

load_dotenv()

from database import engine, Base
import models

# Create tables
Base.metadata.create_all(bind=engine)

# Create uploads directory
os.makedirs("uploads", exist_ok=True)

app = FastAPI(
    title="Enterprise Knowledge Base Management System",
    description="EKBMS REST API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads as static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Import and register routers
from routers import auth, articles, categories, tags, search, comments, ratings, bookmarks, attachments, users, analytics

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(articles.router, prefix="/api/articles", tags=["Articles"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(tags.router, prefix="/api/tags", tags=["Tags"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])
app.include_router(comments.router, prefix="/api", tags=["Comments"])
app.include_router(ratings.router, prefix="/api/articles", tags=["Ratings"])
app.include_router(bookmarks.router, prefix="/api/bookmarks", tags=["Bookmarks"])
app.include_router(attachments.router, prefix="/api", tags=["Attachments"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])


@app.get("/")
def root():
    return {"success": True, "message": "EKBMS API is running", "data": {}}


@app.on_event("startup")
async def startup_event():
    from seed import seed_database
    seed_database()
