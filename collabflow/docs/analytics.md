# Analytics Engine

Location: `/analytics`. Pure Python, no web framework — designed to be
run either as a CLI (for testing/validation) or spawned as a subprocess by
the Node backend (`backend/src/services/pythonService.js`).

## Modules

| File | Responsibility |
|---|---|
| `validation.py` | Load `.xlsx`/`.csv`, detect Likert columns, build a validation report (row/column counts, duplicates, missing values, PII-name flags) |
| `mapping.py` | Smart column mapping — `DISSERTATION_MAPPING` (exact, hand-verified for the bundled file) and `auto_map_columns()` (word-overlap heuristic for arbitrary uploads) |
| `descriptive.py` | Item-level stats, reverse-scoring, composite score calculation, categorical/crosstab summaries |
| `reliability.py` | Cronbach's alpha |
| `correlation.py` | Shapiro-Wilk normality test; Pearson/Spearman with automatic method selection |
| `comparison.py` | Welch's t-test + Mann-Whitney U (2 groups); Kruskal-Wallis (3+ groups) |
| `analysis.py` | Orchestrator — `run_pipeline(df, mapping, eligible_only)` produces the full JSON result |
| `preview.py` | Lightweight CLI used right after upload: validation + mapping only (fast, no full stats run) |

> **Naming note:** the preview script is named `preview.py`, not
> `inspect.py` — naming it `inspect.py` shadows Python's standard-library
> `inspect` module (which NumPy imports internally) and breaks the whole
> import chain. This is a real bug we hit and fixed during development.

## How column mapping works

1. If the uploaded file's columns exactly match the bundled dissertation
   survey's fingerprint column (`is_dissertation_file()`), the hand-verified
   `DISSERTATION_MAPPING` is used directly — no guessing needed for the
   file the app ships with.
2. Otherwise, `auto_map_columns()`:
   - Scores every column against keyword sets for `professional_role`,
     `technical_status`, `hybrid_experience`, `primary_tool`,
     `tool_purpose`, and `open_feedback` using whole-word overlap (not
     brittle exact-phrase matching).
   - Separately identifies all Likert-like (1–5, whole-number) columns,
     then scores each against four keyword sets (UX, Communication,
     Coordination, Performance) to decide which construct block it belongs
     to.
   - Falls back to positional chunking (6/2/2/2, matching the
     dissertation's own instrument shape) only if wording-based matching
     finds nothing at all — e.g. a dataset with fully generic `Q1, Q2, Q3…`
     headers.
   - Flags reverse-scored items by keyword (`reverse`, `unnecessarily`,
     `complex`, `lot`).
3. Every suggested mapping carries a `status` (`auto`/`missing`) and, for
   single-column variables, a `confidence` score, so the frontend can show
   ✓/⚠/✕ and let a user override any mapping manually.

## How reverse-coded items are handled

Reverse-scoring is **never automatic based on wording alone** — it is
driven by the `reverse_scored_items` list produced by the mapping step
(either the hand-verified dissertation list, or the auto-mapper's
keyword-flagged list, both of which a user can override). The transform
itself is `(scale_max + 1) - original_score`, i.e. `6 - x` on a 1–5 scale
(`descriptive.py::reverse_score`).

## How missing data are handled

- `validate_dataset()` reports total missing values and per-column missing
  counts/percentages; it never silently drops rows.
- Composite scores are computed with `skipna=False` at the row level —
  a respondent missing any mapped item for a construct gets `NaN` for that
  construct's composite, rather than a mean over fewer items, to avoid
  quietly changing what "the composite" means row-to-row.
- Correlation and comparison functions use pairwise-complete observations
  (only rows valid on **both** variables in a given test).

## How the default dissertation dataset is loaded / replaced

See `docs/architecture.md` § "Data flow: default dataset vs uploaded
dataset". Both paths call the same `run_pipeline()` function; the only
difference is which mapping is used and which file is read.

## Validation against the dissertation

`analytics/tests/test_analytics.py::TestDissertationValidation` loads the
bundled `dissertation_dataset.xlsx`, runs the full pipeline for both the
full sample (N=84) and the eligibility-filtered sample (N=61), and asserts
that every calculated statistic is within a small tolerance of the value
reported in the dissertation's Chapter 4 — tool frequencies, all four
composite means, all six Spearman correlations, all four Kruskal-Wallis
tests, and all four Cronbach's alpha values. Run it with:

```bash
cd analytics
python -m pytest tests/test_analytics.py -v
```
