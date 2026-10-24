-- TeamSync AI — PostgreSQL Schema Reference (Supabase)
--
-- ROLE & OWNER: Member 3 (Database Designer & AI Engineer)
-- APPLICATION ORM OWNER: Member 2 (SQLAlchemy in backend/models.py)
--
-- This file defines the canonical PostgreSQL database schema reference for TeamSync AI.
-- All table names, column names, data types, nullability, defaults, constraints,
-- and cascade behaviors here are synchronized with Member 2's SQLAlchemy models.
--
-- Architecture decisions:
-- 1. PostgreSQL with UUID primary keys (gen_random_uuid() via pgcrypto).
-- 2. Five core tables: users, projects, project_members, tasks, resources.
-- 3. Referential integrity:
--    - projects.owner_id -> users.id (ON DELETE RESTRICT: prevent orphan projects)
--    - project_members -> projects.id & users.id (ON DELETE CASCADE)
--    - tasks.project_id -> projects.id (ON DELETE CASCADE)
--    - tasks.assignee_id -> users.id (ON DELETE SET NULL: keep tasks if user removed)
--    - resources.project_id -> projects.id (ON DELETE CASCADE)
-- 4. Status strictly in ('To Do', 'In Progress', 'Completed').
-- 5. Priority strictly in ('Low', 'Medium', 'High').
-- 6. No extraneous tables (no chat, audit logs, AI history, or faculty monitoring).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. Users Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name    VARCHAR(120) NOT NULL,
    email   VARCHAR(255) NOT NULL UNIQUE,
    skills  JSONB
);
CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);

-- ============================================================================
-- 2. Projects Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    owner_id    UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_projects_owner_id ON projects (owner_id);

-- ============================================================================
-- 3. Project Members Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_members (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_project_members_project_user UNIQUE (project_id, user_id)
);
CREATE INDEX IF NOT EXISTS ix_project_members_project_id ON project_members (project_id);
CREATE INDEX IF NOT EXISTS ix_project_members_user_id ON project_members (user_id);

-- ============================================================================
-- 4. Tasks Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS tasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES users (id) ON DELETE SET NULL,
    priority    VARCHAR(20) NOT NULL DEFAULT 'Medium'
                CONSTRAINT chk_tasks_priority CHECK (priority IN ('Low', 'Medium', 'High')),
    status      VARCHAR(20) NOT NULL DEFAULT 'To Do'
                CONSTRAINT chk_tasks_status CHECK (status IN ('To Do', 'In Progress', 'Completed')),
    due_date    DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_tasks_project_id ON tasks (project_id);
CREATE INDEX IF NOT EXISTS ix_tasks_status ON tasks (status);
CREATE INDEX IF NOT EXISTS ix_tasks_assignee_id ON tasks (assignee_id);

-- ============================================================================
-- 5. Resources Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS resources (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    title      VARCHAR(200) NOT NULL,
    url        VARCHAR(2048) NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_resources_project_id ON resources (project_id);
