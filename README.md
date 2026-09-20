# CollabFlow — Hybrid Collaboration Analytics Platform

> Analyse collaboration, user experience, communication, coordination and team
> performance using real survey data.

CollabFlow is a full-stack, data-driven analytics platform built from an MSc
dissertation study: *"Evaluating the Impact of Digital Collaboration Tools on
Interdisciplinary Team Performance and User Experience in Hybrid
Workplaces."* It ships with the author's real dissertation survey dataset as
a default demo, and lets anyone upload their own Excel/CSV dataset to run the
same statistical pipeline against different data — no code changes required.

## Research Motivation

The dissertation this project is based on studied how the usability (UX) of
digital collaboration tools (Microsoft Teams, Slack, Zoom) relates to
communication quality, coordination efficiency, and self-reported team
performance in hybrid, interdisciplinary software engineering teams (N=84
survey respondents). CollabFlow turns that one-off statistical analysis into
a reusable, general-purpose web application: the same validation,
reverse-scoring, reliability, correlation, and group-comparison logic that
produced the dissertation's Chapter 4 results now runs against **any**
uploaded dataset with a compatible structure.

## Features

- **Dual dataset mode** — starts with the bundled dissertation dataset;
  users can upload their own `.xlsx`/`.csv` file at any time, or reset back
  to the default.
- **Smart column mapping** — auto-detects role, technical-status, tool,
  and Likert-scale item columns by keyword/word-overlap scoring, even when
  column names differ completely from the original survey.
- **Full statistical pipeline** — descriptive stats, reverse-scoring,
  Cronbach's alpha, Shapiro-Wilk normality testing with automatic
  Pearson/Spearman selection, Welch's t-test, Mann-Whitney U, and
  Kruskal-Wallis — all computed in Python (pandas/NumPy/SciPy), never
  hard-coded.
- **Eligibility filtering** — reproduces the dissertation's own
  eligibility-restricted sensitivity analysis (N=84 full sample vs N=61
  eligible sample) as a toggle, generalised to any "experience" column.
- **Auto-generated insights & recommendations** — derived from calculated
  p-values, never from a fixed script; always phrased as association, never
  causation.
- **Interview Insights** — single-participant qualitative evidence (the
  dissertation's P1 interview), clearly labelled as non-generalisable and
  only shown for the bundled dissertation dataset.
- **Challenges / Open Feedback** — keyword-frequency analysis of open-text
  responses, with honest low-response-rate framing (e.g. the dissertation's
  3-of-84 response rate never gets dressed up as a thematic analysis).
- **Feature Analysis** — surfaces the two available feature-level proxies
  (Q7 integration, Q15 findability) without ever claiming to statistically
  identify "the most influential feature."
- **Reports** — one-click generation of an 18-section text analysis report
  and a cleaned CSV export (composite scores appended), both computed fresh
  from whichever dataset/eligibility filter is currently selected.
- **Dark mode** — toggle in the top bar, persisted in localStorage.
- **Lightweight collaboration workspace** — projects, tasks (Kanban board),
  requirements, meetings, notifications, global search.
- **Validated against the dissertation** — a test suite reproduces every
  number reported in Chapter 4 from the raw Excel file (see
  `analytics/tests/`), including the open-text response counts.

## Architecture

```
React Frontend (Vite, Tailwind, Recharts)
        |
        v
Node.js / Express API  ───────────►  PostgreSQL
        |                             (durable app entities:
        v                              users, projects, tasks,
Python Analytics Engine                requirements, meetings,
(pandas / NumPy / SciPy)               analysis run metadata)
        |
        v
Structured JSON statistical results
```

The Node/Express backend never calculates statistics itself — every number
the frontend displays comes from a JSON payload produced by the Python
analytics engine (`analytics/analysis.py`), which the backend invokes as a
child process. This keeps the statistical logic in one place, in a language
suited to it (pandas/SciPy), and keeps the API layer a thin, testable
wrapper. See `docs/architecture.md` for the full rationale, including why
uploaded spreadsheets are **not** duplicated row-by-row into PostgreSQL.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Recharts, Axios |
| Backend | Node.js, Express |
| Analytics | Python, pandas, NumPy, SciPy, openpyxl |
| Database | PostgreSQL |
| Auth (schema-ready) | JWT |
| Containerisation | Docker, Docker Compose |

## Project Structure

```
collabflow/
├── frontend/           React app (Vite + Tailwind + Recharts)
├── backend/             Express API — wraps the analytics engine
│   └── tests/            Jest/Supertest API tests
├── analytics/            Python statistical engine (no Node/JS statistics)
│   └── tests/             pytest suite incl. dissertation validation
├── data/
│   └── default/           dissertation_dataset.xlsx (bundled, read-only)
├── database/
│   ├── schema.sql          PostgreSQL schema
│   └── seed.sql            Minimal dev seed data
├── docs/                  architecture / API / database / analytics docs
├── docker-compose.yml
├── .env.example
└── README.md (this file)
```

## Dataset Upload Process

1. User drops/selects an `.xlsx` or `.csv` file on the **Datasets** page.
2. The backend saves it, then calls `analytics/preview.py`, which runs
   `validate_dataset()` (row/column counts, duplicate check, missing-value
   check, Likert-column detection, PII-name flagging) and
   `auto_map_columns()` (keyword/word-overlap scoring against the app's
   known variables: role, technical status, tool, and the four Likert
   blocks).
3. The validation report and suggested mapping are shown to the user before
   any statistics are calculated.
4. Every subsequent page (Dashboard, Demographics, UX, Correlations, …)
   calls `GET /api/datasets/analyze`, which runs the **same**
   `analytics/analysis.py` pipeline used for the default dataset — so the
   dissertation dataset and an uploaded dataset are processed through
   identical code.

## Statistical Methods

- **Composite scores**: mean of mapped Likert items per construct, after
  applying reverse-scoring (`6 − x` on a 1–5 scale) to any column flagged as
  reverse-coded.
- **Reliability**: Cronbach's alpha, computed from the reverse-scored item
  matrix; flagged when α < 0.7 rather than silently accepted.
- **Normality**: Shapiro-Wilk on each composite; used to choose Pearson
  (both normal) vs Spearman (otherwise) as the *primary* correlation method
  — both are always reported for comparison.
- **Correlation**: Pearson's r and Spearman's ρ, with p-values, sample size,
  and a plain-language, non-causal interpretation string.
- **Group comparisons**: Welch's t-test + Mann-Whitney U for two groups
  (e.g. technical vs non-technical); Kruskal-Wallis H for 3+ groups (e.g.
  tool comparison).
- **Significance**: α = 0.05 throughout; results below this are explicitly
  labelled "not statistically significant," never silently omitted.

None of these numbers are hard-coded in `analysis.py`. The dissertation's
reported figures (e.g. Spearman ρ = 0.249 for Coordination–Performance) are
used **only** as validation targets in the test suite — see
`analytics/tests/test_analytics.py::TestDissertationValidation`, which
reproduces all of them from the raw Excel file bundled in this repo.

## Installation

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+ (optional for the analytics MVP — see `docs/architecture.md`)
- Docker & Docker Compose (optional, for containerised setup)

### Local setup (without Docker)

```bash
# 1. Clone and enter the project
cd collabflow

# 2. Install Python analytics dependencies
cd analytics
pip install -r requirements.txt
cd ..

# 3. Install and start the backend
cd backend
npm install
cp ../.env.example ../.env   # edit as needed
npm run dev                  # http://localhost:5000

# 4. In a new terminal, install and start the frontend
cd frontend
npm install
npm run dev                  # http://localhost:5173
```

The frontend's Vite dev server proxies `/api` requests to `http://localhost:5000`
automatically (see `frontend/vite.config.js`), so no extra configuration is
needed for local development.

### With Docker Compose

```bash
docker compose up --build
```

This starts PostgreSQL, the backend (with the Python analytics engine baked
in), and the frontend (served via nginx, proxying `/api` to the backend).
Frontend: http://localhost:8080 · Backend: http://localhost:5000

### Deploying live (Netlify + Render)

See `docs/deployment.md` for the full step-by-step guide. Short version:
the React frontend deploys to **Netlify** (static build), and the
Express + Python backend deploys to **Render** (or Railway/Fly.io) using
the same `backend/Dockerfile` this repo already ships — Netlify alone
cannot run the persistent backend or spawn Python subprocesses.

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Purpose |
|---|---|
| `PORT` | Backend server port |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing auth tokens (if auth is enabled) |
| `PYTHON_ANALYTICS_PATH` | Path to the `analytics/` directory |
| `UPLOAD_DIRECTORY` | Where uploaded datasets are stored |
| `MAX_FILE_SIZE_MB` | Upload size limit |

## Running Tests

```bash
# Python analytics tests (includes dissertation validation) — 22 tests
cd analytics
python -m pytest tests/ -v

# Backend API tests — 11 tests
cd backend
npm test
```

## API Documentation

See `docs/api.md` for the full endpoint reference.

## Screenshots

_(placeholder — add screenshots of the Dashboard, Upload, and Correlations
pages here once deployed)_

## Important Notes & Limitations

- The bundled UX/Usability scale is an **adapted six-item instrument**
  inspired by SUS-style wording — it is explicitly labelled "Adapted
  UX/Usability Scale" throughout the UI and is **not** the official 10-item
  System Usability Scale.
- Statistical interpretations throughout the app describe **association**,
  never causation.
- The collaboration workspace module (projects/tasks/requirements/meetings)
  is implemented as an in-memory MVP for this stage; `database/schema.sql`
  defines the full production schema it would persist to.
- Uploaded datasets are processed for the current session only and are not
  sent to any third-party AI service.

## Future Improvements

- Wire the collaboration workspace module to PostgreSQL (schema is ready).
- Add authentication (JWT scaffolding is present but not enforced yet).
- PDF export of the full analysis report.
- Mediation analysis (e.g. does coordination mediate UX → performance?).
- Support for additional file formats (e.g. `.json`, Google Sheets import).
