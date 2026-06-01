-- Core schema for WorkDesk Enterprise SaaS B2B Workspace database
-- Run this in your Supabase SQL Editor to initialize all tables!

-- Disable trigger checks for schema setup
SET session_replication_role = 'replica';

BEGIN;

-- 1. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. USERS TABLE (Enterprise staff database)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY,
    company_id VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. TEAMS TABLE (Department structures)
CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR PRIMARY KEY,
    company_id VARCHAR NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_teams_company ON teams(company_id);

-- 4. TASKS TABLE (Operations queues)
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR PRIMARY KEY,
    company_id VARCHAR NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_company ON tasks(company_id);

-- 5. PERFORMANCE SCORES TABLE (Staff leaderboard indices)
CREATE TABLE IF NOT EXISTS performance_scores (
    id VARCHAR PRIMARY KEY,
    company_id VARCHAR NOT NULL,
    user_id VARCHAR NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_perf_company ON performance_scores(company_id);
CREATE INDEX IF NOT EXISTS idx_perf_user ON performance_scores(user_id);

-- 6. CLIENTS TABLE (B2B CRM databases)
CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR PRIMARY KEY,
    company_id VARCHAR NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_id);

-- 7. COMMUNICATION LOGS TABLE (Client activity registers)
CREATE TABLE IF NOT EXISTS communication_logs (
    id VARCHAR PRIMARY KEY,
    company_id VARCHAR NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comm_logs_company ON communication_logs(company_id);

-- 8. NOTIFICATIONS TABLE (Corporate system notifications)
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR PRIMARY KEY,
    company_id VARCHAR NOT NULL,
    user_id VARCHAR NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_company ON notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Explicitly Disable Row Level Security (RLS) on all created tables to ensure Vercel requests succeed
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE performance_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Commit structural setup
COMMIT;

-- Restore standard session rules
SET session_replication_role = 'origin';

-- OPTIONAL SEED DATA INJECTION
-- Uncomment and run the section below if you would like to seed your Supabase database with the default system personas:
-- (Otherwise, the system will populate seeds automatically on your first local/ephemeral boot!)
