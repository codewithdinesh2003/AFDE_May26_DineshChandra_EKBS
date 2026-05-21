-- Enterprise Knowledge Base Management System
-- Schema SQL

DROP DATABASE IF EXISTS ekbms_db;
CREATE DATABASE ekbms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ekbms_db;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin','author','reviewer','employee') DEFAULT 'employee',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Categories table (supports hierarchy)
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Tags table
CREATE TABLE tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
) ENGINE=InnoDB;

-- Articles table
CREATE TABLE articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    summary VARCHAR(500),
    category_id INT,
    author_id INT,
    status ENUM('draft','pending','approved','rejected','archived') DEFAULT 'draft',
    view_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- FULLTEXT index for search
ALTER TABLE articles ADD FULLTEXT INDEX ft_articles_search (title, content);

-- Performance indexes
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_category_id ON articles(category_id);
CREATE INDEX idx_articles_author_id ON articles(author_id);

-- Article-Tag join table
CREATE TABLE article_tags (
    article_id INT NOT NULL,
    article_tag_id INT NOT NULL,
    PRIMARY KEY (article_id, article_tag_id),
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (article_tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Attachments table
CREATE TABLE attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_size INT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Comments table
CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT NOT NULL,
    user_id INT,
    comment_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Ratings table
CREATE TABLE ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT NOT NULL,
    user_id INT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_rating (article_id, user_id)
) ENGINE=InnoDB;

-- Bookmarks table
CREATE TABLE bookmarks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_bookmark (article_id, user_id)
) ENGINE=InnoDB;

-- Approval workflow table
CREATE TABLE approval_workflow (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT NOT NULL,
    reviewer_id INT,
    action ENUM('approved','rejected') NOT NULL,
    comments TEXT,
    actioned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── Phase 2 Tables ────────────────────────────────────────────────────────────

-- Article daily view analytics
CREATE TABLE article_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT NOT NULL,
    view_date DATE NOT NULL,
    view_count INT DEFAULT 1,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_daily_view (article_id, view_date)
) ENGINE=InnoDB;

-- Search keyword logs
CREATE TABLE search_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    keyword VARCHAR(255) NOT NULL,
    user_id INT NULL,
    results_count INT DEFAULT 0,
    searched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Weekly category trend snapshots
CREATE TABLE category_trends (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    week_start DATE NOT NULL,
    article_count INT DEFAULT 0,
    total_views INT DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_weekly_trend (category_id, week_start)
) ENGINE=InnoDB;

-- Author aggregated statistics
CREATE TABLE author_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    author_id INT UNIQUE NOT NULL,
    total_articles INT DEFAULT 0,
    approved_articles INT DEFAULT 0,
    pending_articles INT DEFAULT 0,
    rejected_articles INT DEFAULT 0,
    total_views INT DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0.00,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ETL job execution history
CREATE TABLE etl_job_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_name VARCHAR(100) NOT NULL,
    source_file VARCHAR(255),
    status ENUM('running','completed','failed') DEFAULT 'running',
    total_records INT DEFAULT 0,
    success_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    error_log TEXT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL
) ENGINE=InnoDB;
