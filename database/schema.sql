-- CollabFlow PostgreSQL schema
-- Architecture note: uploaded spreadsheet data is NOT duplicated row-by-row
-- into this database. Datasets are processed directly by the Python
-- analytics engine from disk. This schema persists durable APPLICATION
-- entities: users, dataset metadata, analysis run history, and the
-- collaboration workspace (projects/teams/tasks/requirements/meetings).
-- See docs/architecture.md for the full rationale.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================
-- Users & Auth
-- ==========================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'member', -- member | admin
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================================
-- Datasets (metadata only — not row-level survey data)
-- ==========================================================
CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    row_count INTEGER,
    column_count INTEGER,
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE dataset_columns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
    column_name VARCHAR(500) NOT NULL,
    detected_dtype VARCHAR(50), -- likert | numeric | categorical | text | datetime
    missing_count INTEGER DEFAULT 0,
    unique_values INTEGER
);

-- Optional: only populated if a user explicitly asks to persist a
-- cleaned/small dataset snapshot; not used for the default analytics flow.
CREATE TABLE dataset_rows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
    row_index INTEGER NOT NULL,
    row_data JSONB NOT NULL
);

-- ==========================================================
-- Column mapping (per dataset, per session)
-- ==========================================================
CREATE TABLE column_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
    mapping_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================================
-- Analysis runs & results (the audit trail of statistical runs)
-- ==========================================================
CREATE TABLE analysis_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
    eligible_filter_applied BOOLEAN DEFAULT false,
    n_used INTEGER,
    excluded_count INTEGER DEFAULT 0,
    run_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_run_id UUID REFERENCES analysis_runs(id) ON DELETE CASCADE,
    result_type VARCHAR(100) NOT NULL, -- 'kpi' | 'correlation' | 'reliability' | 'comparison' | 'insight'
    result_json JSONB NOT NULL
);

-- ==========================================================
-- Collaboration workspace (lightweight PM module)
-- ==========================================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE team_members (
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_in_team VARCHAR(100), -- Developer | Business Analyst | QA Engineer | UX Designer | Project Manager | ...
    PRIMARY KEY (team_id, user_id)
);

CREATE TABLE requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'Normal', -- Low | Normal | High | Critical
    status VARCHAR(50) DEFAULT 'Open',
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    requirement_id UUID REFERENCES requirements(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES users(id),
    priority VARCHAR(20) DEFAULT 'Normal',
    status VARCHAR(50) DEFAULT 'To Do', -- To Do | In Progress | Blocked | Done
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    meeting_date TIMESTAMPTZ,
    agenda TEXT,
    notes TEXT,
    decisions TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(20) DEFAULT 'NORMAL', -- CRITICAL | HIGH | NORMAL | LOW
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================================
-- CollabFlow application UX feedback (distinct from dissertation dataset)
-- ==========================================================
CREATE TABLE ux_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    ease_of_use SMALLINT CHECK (ease_of_use BETWEEN 1 AND 5),
    ease_of_learning SMALLINT CHECK (ease_of_learning BETWEEN 1 AND 5),
    confidence SMALLINT CHECK (confidence BETWEEN 1 AND 5),
    feature_integration SMALLINT CHECK (feature_integration BETWEEN 1 AND 5),
    overall_satisfaction SMALLINT CHECK (overall_satisfaction BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_requirements_project ON requirements(project_id);
CREATE INDEX idx_analysis_runs_dataset ON analysis_runs(dataset_id);
CREATE INDEX idx_dataset_rows_dataset ON dataset_rows(dataset_id);
