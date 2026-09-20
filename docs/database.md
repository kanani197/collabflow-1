# Database

## Engine
PostgreSQL 14+ (16 in `docker-compose.yml`).

## Schema
See `database/schema.sql` for the full DDL. Summary of tables:

| Table | Purpose |
|---|---|
| `users` | Application accounts (JWT auth-ready) |
| `datasets` | Metadata for the default + any uploaded datasets (label, path, row/column counts) — **not** row-level survey data |
| `dataset_columns` | Per-dataset column profile (detected dtype, missing count, unique values) |
| `dataset_rows` | Optional JSONB row snapshot — only populated if a dataset is explicitly persisted beyond a session |
| `column_mappings` | Saved app-variable → uploaded-column mapping per dataset |
| `analysis_runs` | Audit trail: which dataset, eligibility filter, N used, when |
| `analysis_results` | Structured results per run, typed by `result_type` (kpi/correlation/reliability/comparison/insight) |
| `projects`, `teams`, `team_members` | Collaboration workspace structure |
| `requirements`, `tasks` | Work items, each linkable to a project and (for tasks) a requirement |
| `meetings` | Meeting records with agenda/notes/decisions |
| `messages` | Project-scoped chat messages |
| `notifications` | User notifications with a 4-tier priority (`CRITICAL`/`HIGH`/`NORMAL`/`LOW`) |
| `ux_feedback` | CollabFlow application self-feedback (1–5 Likert), kept separate from dissertation survey data |

## Why uploaded spreadsheets aren't fully normalised here

See `docs/architecture.md` § "Why the backend doesn't touch PostgreSQL for
uploaded spreadsheet data" for the full rationale. In short: the Python
analytics engine reads files directly from disk, which is faster and
simpler than an ETL round-trip through Postgres for data that is
structurally different on every upload and not queried relationally.

## Running migrations locally

This project ships a single `schema.sql` rather than a migration tool, to
keep the MVP simple:

```bash
psql $DATABASE_URL -f database/schema.sql
psql $DATABASE_URL -f database/seed.sql   # optional dev seed data
```

With Docker Compose, both files are mounted into
`/docker-entrypoint-initdb.d/` and run automatically on first container
start.
