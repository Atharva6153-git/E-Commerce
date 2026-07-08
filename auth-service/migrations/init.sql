-- Run this once to create the users table inside auth_db.
-- How to run: see the README instructions Claude gives you in chat.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'customer',  -- customer / admin
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups during login
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
