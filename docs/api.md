# API Documentation

Base URL (dev): `http://localhost:5000/api`

All dataset-scoped endpoints read an `X-Session-Id` header to know which
dataset the caller is currently working with. If omitted, the shared
default session (dissertation dataset) is used.

## Health

### `GET /health`
Returns service status.

```json
{ "status": "ok", "service": "CollabFlow API", "time": "2026-09-10T12:00:00.000Z" }
```

## Datasets

### `POST /datasets/upload`
Multipart form upload. Field name: `file`. Accepts `.xlsx`, `.xls`, `.csv`,
up to `MAX_FILE_SIZE_MB` (default 10MB).

**Response 200**
```json
{
  "file": "team_survey.xlsx",
  "rows": 60,
  "columns": 13,
  "validation": { "status": "ready", "checks": [...], "warnings": [...] },
  "mapping": { "professional_role": {...}, "ux_items": {...}, ... },
  "isDissertationFile": false,
  "sessionId": "sess_abc123"
}
```

**Response 400** — unsupported file type, empty file, or a file with no
usable structure. `{ "error": "..." }`

### `GET /datasets/current`
Returns metadata for whichever dataset the current session is using.

```json
{
  "label": "Dissertation Dataset",
  "isDefault": true,
  "rows": 84,
  "columns": 19,
  "validation": { ... },
  "mapping": { ... }
}
```

### `GET /datasets/analyze?eligible=true|false`
Runs the full statistical pipeline and returns the complete analysis
result consumed by every dashboard page.

```json
{
  "dataset_label": "Dissertation Dataset",
  "sample": { "n_total_uploaded": 84, "n_used": 61, "excluded_by_eligibility": 23, "eligible_filter_applied": true },
  "kpis": { "total_respondents": 61, "ux_mean": 2.8, "communication_mean": 2.73, ... },
  "demographics": { "professional_role": {...}, "technical_status": {...}, "hybrid_experience": {...} },
  "tool_usage": { "summary": {...}, "purpose": {...}, "by_role": {...} },
  "constructs": { "ux": {...}, "communication": {...}, "coordination": {...}, "performance": {...} },
  "reliability": { "ux": { "alpha": 0.06, "flag_low": true, ... }, ... },
  "normality": { "ux": { "W": ..., "p": ..., "normal": false }, ... },
  "correlations": [ { "variable_a": "UX / Usability", "variable_b": "Communication", "coefficient": 0.234, "p_value": 0.032, "significant": true, ... }, ... ],
  "technical_vs_nontechnical": { "ux": { "welch_t": ..., "mann_whitney_u": ..., ... }, ... },
  "tool_comparison": { "ux": { "H": 7.05, "df": 2, "p": 0.029, "significant": true }, ... },
  "insights": [ { "type": "positive", "text": "..." }, ... ],
  "recommendations": [ { "label": "Data-informed recommendation", "text": "..." }, ... ]
}
```

### `POST /datasets/reset`
Restores the session to the bundled dissertation dataset.

### `POST /datasets/mapping`
Body: `{ "mapping": { ... } }`. Overrides the auto-detected mapping for
the current session (used by the manual column-mapping UI).

## Collaboration Workspace

Standard CRUD for each of: `projects`, `teams`, `tasks`, `requirements`,
`meetings`, `notifications`, `messages`.

- `GET /collaboration/:resource` — list all
- `POST /collaboration/:resource` — create (body becomes the record)
- `PATCH /collaboration/:resource/:id` — partial update
- `DELETE /collaboration/:resource/:id` — delete

### `GET /collaboration/search?q=...`
Global search across projects, tasks, requirements, meetings, and messages.

```json
{ "results": [ { "type": "task", "id": "...", "item": {...} } ] }
```

## Export

### `GET /export/cleaned-csv?eligible=true|false`
Returns the current dataset as CSV (`text/csv`), with each construct's
composite score appended as an extra column. Respects the current session's
dataset and the eligibility filter passed as a query param.

### `GET /export/report?eligible=true|false`
Returns a plain-text (`text/plain`), 18-section analysis report generated
fresh from the current dataset's live analysis result — dataset overview,
data quality, demographics, tool usage, all four constructs, reliability,
normality, correlations, group/tool comparisons, open feedback, interview
insights, key findings, recommendations, and limitations.

## Feedback (CollabFlow application UX, not the dissertation dataset)

### `POST /feedback`
Body: `{ "easeOfUse": 1-5, "easeOfLearning": 1-5, "confidence": 1-5, "integration": 1-5, "satisfaction": 1-5, "comment": "optional" }`

### `GET /feedback/summary`
Returns averages across all submitted feedback.

## Error format

All error responses follow:
```json
{ "error": "Human-readable message" }
```
