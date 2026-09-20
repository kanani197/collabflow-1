# Architecture

## Overview

CollabFlow separates concerns across three layers:

1. **React frontend** — presentation only. Never calculates statistics.
2. **Node/Express backend** — thin API layer. Handles file upload,
   validation orchestration, session/dataset state, and the lightweight
   collaboration workspace. It spawns the Python analytics engine as a
   child process for anything statistical.
3. **Python analytics engine** — the only place statistics are computed.
   pandas/NumPy/SciPy are far better suited to this than JavaScript, and
   keeping all statistical logic in one language/module makes it possible
   to unit-test and validate independently of the web stack (see
   `analytics/tests/test_analytics.py`).

## Why the backend doesn't touch PostgreSQL for uploaded spreadsheet data

The brief asks for a `dataset_rows` table in the schema, and it exists in
`database/schema.sql` for completeness / future use. However, for the
**current MVP**, uploaded files are:

1. Saved to disk (`UPLOAD_DIRECTORY`).
2. Read directly by pandas in the Python analytics engine.
3. Discarded from active memory once the analysis JSON is returned.

Row-by-row duplication into PostgreSQL was deliberately avoided for this
stage because:

- It adds an ETL step (write file → parse → insert N rows → re-query) that
  provides no benefit when the file itself is already a fast, randomly-
  accessible source of truth for pandas.
- Spreadsheet schemas vary per upload (different column counts/types per
  user), which would require a wide/sparse or JSONB-heavy table design
  regardless — see `dataset_rows.row_data JSONB` in the schema, which is
  the fallback design if/when full persistence is needed (e.g. to support
  returning to an old analysis without the original file).
- The dissertation dataset — the app's core demo — never changes, so
  persisting it relationally has no analytical benefit.

PostgreSQL is used for what changes independently of any one dataset and
needs to persist across sessions: user accounts, dataset **metadata**
(label, row/column counts, upload timestamp), column mappings, analysis run
history (audit trail — which dataset, which filter, when), and the
collaboration workspace (projects, tasks, requirements, meetings,
notifications).

## Session model

The analytics MVP uses a simple session-ID header (`X-Session-Id`,
generated and stored in the browser's `localStorage`) to track "what
dataset is this browser currently looking at" via an in-memory map in
`backend/src/services/sessionStore.js`. This stands in for a `sessions`
table; swapping it for a real Postgres-backed session (keyed by
`analysis_runs.id`) is a drop-in change once persistence is needed for
multi-device continuity.

## Data flow: default dataset vs uploaded dataset

Both paths converge on the exact same function,
`analytics/analysis.py::run_pipeline()`:

```
Default:   dissertation_dataset.xlsx ──► DISSERTATION_MAPPING (exact, verified)
                                             │
Uploaded:  user_file.xlsx/.csv        ──► auto_map_columns() (heuristic)
                                             │
                                             ▼
                                      run_pipeline(df, mapping, eligible_only)
                                             │
                                             ▼
                                  Structured JSON (KPIs, demographics,
                                  constructs, reliability, correlations,
                                  comparisons, insights, recommendations)
```

This guarantees there is no special-cased "demo mode" — the dissertation
dataset is treated as just another (very well-characterised) dataset, and
any statistical bug fix or feature applies identically to both.

## Statistical integrity rules enforced in code

- `analysis.py` contains **no hard-coded dissertation numbers**. Every
  value is computed from whatever DataFrame is passed in — verified by
  `analytics/tests/test_analytics.py::TestDissertationValidation`.
- Composite scores require at least 1 mapped item; reliability (Cronbach's
  alpha) requires at least 2, and is not calculated (rather than silently
  defaulted) below that threshold.
- Significance is always reported alongside interpretation text — never a
  bare "significant"/"not significant" without the underlying statistic.
- All correlation/comparison interpretation strings use "associated with"
  language; nothing in the codebase emits causal claims.
