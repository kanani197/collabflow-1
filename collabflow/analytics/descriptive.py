"""
descriptive.py
Item-level descriptive statistics, reverse scoring, and composite score
calculation for a Likert-scale block (UX, Communication, Coordination,
Performance).
"""
import numpy as np
import pandas as pd

LIKERT_MAX = 5


def reverse_score(series: pd.Series, scale_max: int = LIKERT_MAX) -> pd.Series:
    """reverse = (scale_max + 1) - original.  For a 1-5 scale: 6 - x."""
    return (scale_max + 1) - series


def item_stats(df: pd.DataFrame, column: str) -> dict:
    s = pd.to_numeric(df[column], errors="coerce").dropna()
    if len(s) == 0:
        return None
    freq = s.value_counts().sort_index().to_dict()
    return {
        "column": column,
        "n": int(len(s)),
        "mean": round(float(s.mean()), 3),
        "median": round(float(s.median()), 3),
        "sd": round(float(s.std(ddof=1)), 3) if len(s) > 1 else 0.0,
        "min": float(s.min()),
        "max": float(s.max()),
        "frequency": {str(int(k)): int(v) for k, v in freq.items()},
    }


def composite_score(df: pd.DataFrame, columns: list, reverse_columns: list = None,
                     scale_max: int = LIKERT_MAX) -> dict:
    """Build a composite (mean-of-items) score for a scale, applying
    reverse-scoring to any columns flagged as reverse-coded first.

    Returns per-item stats, the reversed working data, and the composite
    series stats. If fewer than 2 valid columns are supplied, returns
    None with a reason (composite requires at least 2 items to be
    meaningful)."""
    reverse_columns = set(reverse_columns or [])
    valid_columns = [c for c in columns if c in df.columns]

    if len(valid_columns) < 1:
        return {"available": False, "reason": "No mapped items found for this scale."}

    working = pd.DataFrame(index=df.index)
    items_out = []
    for col in valid_columns:
        series = pd.to_numeric(df[col], errors="coerce")
        if col in reverse_columns:
            series = reverse_score(series, scale_max)
        working[col] = series
        stats = item_stats(pd.DataFrame({col: series}), col)
        if stats:
            stats["reverse_scored"] = col in reverse_columns
            items_out.append(stats)

    composite = working.mean(axis=1, skipna=False)
    composite_valid = composite.dropna()

    result = {
        "available": True,
        "n_items": len(valid_columns),
        "items": items_out,
        "composite_series": composite,  # kept in-memory for downstream use, not serialised directly
        "composite_stats": {
            "n": int(len(composite_valid)),
            "mean": round(float(composite_valid.mean()), 3) if len(composite_valid) else None,
            "sd": round(float(composite_valid.std(ddof=1)), 3) if len(composite_valid) > 1 else None,
            "min": round(float(composite_valid.min()), 3) if len(composite_valid) else None,
            "max": round(float(composite_valid.max()), 3) if len(composite_valid) else None,
        },
    }
    if len(valid_columns) < 2:
        result["warning"] = ("Only one item was available for this scale; the "
                              "composite is based on a single item and reliability "
                              "(Cronbach's alpha) cannot be calculated.")
    return result


def categorical_summary(df: pd.DataFrame, column: str) -> dict:
    if column not in df.columns:
        return {"available": False, "reason": "Variable not available in uploaded dataset."}
    counts = df[column].value_counts(dropna=True)
    total = int(counts.sum())
    return {
        "available": True,
        "column": column,
        "total": total,
        "categories": [
            {"label": str(idx), "count": int(cnt), "pct": round(cnt / total * 100, 1) if total else 0}
            for idx, cnt in counts.items()
        ],
    }


def crosstab_summary(df: pd.DataFrame, col_a: str, col_b: str) -> dict:
    if col_a not in df.columns or col_b not in df.columns:
        return {"available": False, "reason": "Variable not available in uploaded dataset."}
    ct = pd.crosstab(df[col_a], df[col_b])
    return {
        "available": True,
        "rows": ct.index.astype(str).tolist(),
        "columns": ct.columns.astype(str).tolist(),
        "matrix": ct.values.tolist(),
    }
