-- Team Accountability App Database Schema for Vercel Postgres
-- This file creates all necessary tables for persistent data storage

-- Users table - stores all team members and admins
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily commitments table - stores daily commitments for each user
CREATE TABLE IF NOT EXISTS daily_commitments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    commitment_text TEXT NOT NULL,
    commitment_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'not_completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weekly goals table - stores weekly goals for each user
CREATE TABLE IF NOT EXISTS weekly_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    goal_text TEXT NOT NULL,
    target_date DATE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reflections table - stores user reflections
CREATE TABLE IF NOT EXISTS reflections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reflection_date DATE NOT NULL,
    wins TEXT,
    challenges TEXT,
    tomorrow_focus TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, reflection_date)
);

-- Message history table - stores SMS messaging history
CREATE TABLE IF NOT EXISTS message_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(50) NOT NULL,
    message_text TEXT NOT NULL,
    webhook_url TEXT,
    success BOOLEAN DEFAULT false,
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Webhook configuration table - stores Zapier webhook URLs
CREATE TABLE IF NOT EXISTS webhook_config (
    id SERIAL PRIMARY KEY,
    webhook_type VARCHAR(50) UNIQUE NOT NULL,
    webhook_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_commitments_user_date ON daily_commitments(user_id, commitment_date);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_user_status ON weekly_goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_reflections_user_date ON reflections(user_id, reflection_date);
CREATE INDEX IF NOT EXISTS idx_message_history_user_sent ON message_history(user_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Insert default admin user (Brian Curtis)
INSERT INTO users (email, password, name, phone, role) 
VALUES ('brian@searchnwa.com', 'admin123', 'Brian Curtis', '+1-555-0101', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert demo users for testing
INSERT INTO users (email, password, name, phone, role) 
VALUES 
    ('john@example.com', 'john123', 'John Doe', '+1-555-0102', 'member'),
    ('jane@example.com', 'jane123', 'Jane Smith', '+1-555-0103', 'member')
ON CONFLICT (email) DO NOTHING;
