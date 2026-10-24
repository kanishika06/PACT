-- TeamSync AI — PostgreSQL schema reference
--
-- OWNER: Member 3. Member 2 owns the SQLAlchemy models in backend/models.py;
-- this file is the schema reference and must stay in sync with them
-- (table names, column names, types, nullability, defaults, constraints).
--
-- Generated from backend/models.py as a starting point. Coordinate any change
-- across both files.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name    VARCHAR(120) NOT NULL,
    email   VARCHAR(255) NOT NULL UNIQUE,
    skills  JSONB
);
CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);

CREATE TABLE IF NOT EXISTS projects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    owner_id    UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_projects_owner_id ON projects (owner_id);

CREATE TABLE IF NOT EXISTS project_members (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_project_members_project_user UNIQUE (project_id, user_id)
);
CREATE INDEX IF NOT EXISTS ix_project_members_project_id ON project_members (project_id);

-- status   must be one of: 'To Do', 'In Progress', 'Completed'
-- priority must be one of: 'Low', 'Medium', 'High'
CREATE TABLE IF NOT EXISTS tasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES users (id) ON DELETE SET NULL,
    priority    VARCHAR(20) NOT NULL DEFAULT 'Medium',
    status      VARCHAR(20) NOT NULL DEFAULT 'To Do',
    due_date    DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_tasks_project_id ON tasks (project_id);
CREATE INDEX IF NOT EXISTS ix_tasks_status ON tasks (status);

CREATE TABLE IF NOT EXISTS resources (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    title      VARCHAR(200) NOT NULL,
    url        VARCHAR(2048) NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_resources_project_id ON resources (project_id);
