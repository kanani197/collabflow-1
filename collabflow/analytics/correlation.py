"""
correlation.py
Shapiro-Wilk normality testing, and Pearson/Spearman correlation with
automatic method selection based on the normality result — mirroring
the dissertation's own analytical decision rule (non-normal -> Spearman
as primary, Pearson reported for comparison).
"""
import numpy as np
import pandas as pd
from scipy import stats

ALPHA = 0.05


def shapiro_test(series) -> dict:
    clean = series.dropna()
    if len(clean) < 3:
        return {"available": False, "reason": "Insufficient sample size for Shapiro-Wilk test (n < 3)."}
    if len(clean) > 5000:
        clean = clean.sample(5000, random_state=42)
    try:
        w, p = stats.shapiro(clean)
    except Exception as e:
        return {"available": False, "reason": f"Normality test failed: {e}"}
    return {
        "available": True,
        "n": int(len(clean)),
        "W": round(float(w), 4),
        "p": round(float(p), 4),
        "normal": bool(p >= ALPHA),
    }


def correlate_pair(name_a, series_a, name_b, series_b) -> dict:
    """Compute both Pearson and Spearman for a pair of composite scores,
    select the primary method by normality, and report significance.
    Uses pairwise-complete observations (rows valid on both variables)."""
    paired = np.array(list(zip(series_a, series_b)), dtype=float)
    mask = ~np.isnan(paired).any(axis=1)
    a = paired[mask, 0]
    b = paired[mask, 1]
    n = len(a)

    if n < 3:
        return {
            "pair": f"{name_a}-{name_b}",
            "available": False,
            "reason": "Insufficient sample size for reliable statistical inference.",
        }

    norm_a = shapiro_test(pd.Series(a))
    norm_b = shapiro_test(pd.Series(b))
    both_normal = norm_a.get("normal", False) and norm_b.get("normal", False)
    primary_method = "pearson" if both_normal else "spearman"

    try:
        pear_r, pear_p = stats.pearsonr(a, b)
    except Exception:
        pear_r, pear_p = None, None
    try:
        spear_r, spear_p = stats.spearmanr(a, b)
    except Exception:
        spear_r, spear_p = None, None

    primary_r = pear_r if primary_method == "pearson" else spear_r
    primary_p = pear_p if primary_method == "pearson" else spear_p
    significant = bool(primary_p is not None and primary_p < ALPHA)

    return {
        "pair": f"{name_a}-{name_b}",
        "variable_a": name_a,
        "variable_b": name_b,
        "available": True,
        "n": int(n),
        "primary_method": primary_method,
        "primary_reasoning": (
            "Both variables approximated normal distribution (Shapiro-Wilk p>=.05); Pearson used."
            if both_normal else
            "One or both variables departed from normality (Shapiro-Wilk p<.05); Spearman used as primary, Pearson reported for comparison."
        ),
        "pearson_r": round(float(pear_r), 3) if pear_r is not None else None,
        "pearson_p": round(float(pear_p), 4) if pear_p is not None else None,
        "spearman_rho": round(float(spear_r), 3) if spear_r is not None else None,
        "spearman_p": round(float(spear_p), 4) if spear_p is not None else None,
        "coefficient": round(float(primary_r), 3) if primary_r is not None else None,
        "p_value": round(float(primary_p), 4) if primary_p is not None else None,
        "significant": significant,
        "interpretation": (
            f"A statistically significant association was observed between {name_a} and {name_b} "
            f"({primary_method.title()} = {round(float(primary_r), 3) if primary_r is not None else 'n/a'}, "
            f"p = {round(float(primary_p), 4) if primary_p is not None else 'n/a'}). "
            f"This indicates association, not causation."
            if significant else
            f"No statistically significant association was observed between {name_a} and {name_b} "
            f"({primary_method.title()} = {round(float(primary_r), 3) if primary_r is not None else 'n/a'}, "
            f"p = {round(float(primary_p), 4) if primary_p is not None else 'n/a'})."
        ),
    }
