-- EKBMS Seed Data
-- NOTE: Passwords are hashed by the Python backend on first startup.
-- This SQL file is provided as reference only.
-- The application auto-seeds the database when it starts with an empty users table.
-- To seed manually, run: python backend/seed.py

USE ekbms_db;

-- Default Users (passwords hashed by Python)
-- admin@ekbms.com     / admin123
-- author@ekbms.com    / author123
-- reviewer@ekbms.com  / reviewer123
-- employee@ekbms.com  / employee123

INSERT INTO users (name, email, password_hash, role) VALUES
('Admin User',    'admin@ekbms.com',    'HASHED_IN_PYTHON', 'admin'),
('John Author',   'author@ekbms.com',   'HASHED_IN_PYTHON', 'author'),
('Sara Reviewer', 'reviewer@ekbms.com', 'HASHED_IN_PYTHON', 'reviewer'),
('Mike Employee', 'employee@ekbms.com', 'HASHED_IN_PYTHON', 'employee');

-- Default Categories
INSERT INTO categories (name, description) VALUES
('HR Policies',       'Human Resources policies and procedures'),
('IT Support',        'IT troubleshooting and support guides'),
('Infrastructure',    'Network and infrastructure documentation'),
('Training Materials','Employee training resources'),
('Finance',           'Finance and expense policies'),
('Operations',        'Operational procedures and SOPs');

-- Default Tags
INSERT INTO tags (name) VALUES
('onboarding'), ('troubleshooting'), ('policy'), ('guide'),
('FAQ'), ('SOP'), ('training'), ('security'), ('finance'), ('general');

-- Sample articles are seeded by the Python seed.py script
-- which properly hashes passwords and creates relationships.
