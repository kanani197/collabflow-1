"""
comparison.py
Two-group (Welch t-test + Mann-Whitney U) and multi-group
(Kruskal-Wallis) comparisons for composite scores across a categorical
grouping variable (e.g. technical vs non-technical, or tool).
"""
import numpy as np
import pandas as pd
from scipy import stats

ALPHA = 0.05


def two_group_comparison(values: pd.Series, groups: pd.Series, label_a=None, label_b=None) -> dict:
    df = pd.DataFrame({"value": values, "group": groups}).dropna()
    labels = df["group"].unique().tolist()
    if len(labels) != 2:
        return {"available": False, "reason": f"Two-group comparison requires exactly 2 groups; found {len(labels)}."}

    label_a = label_a or labels[0]
    label_b = label_b or labels[1]
    a = df.loc[df["group"] == label_a, "value"].values
    b = df.loc[df["group"] == label_b, "value"].values

    if len(a) < 2 or len(b) < 2:
        return {"available": False, "reason": "Insufficient sample size in one or more groups for reliable statistical inference."}

    t_stat, t_p = stats.ttest_ind(a, b, equal_var=False)  # Welch's t-test
    try:
        u_stat, u_p = stats.mannwhitneyu(a, b, alternative="two-sided")
    except Exception:
        u_stat, u_p = None, None

    def describe(arr):
        return {
            "n": int(len(arr)),
            "mean": round(float(np.mean(arr)), 3),
            "sd": round(float(np.std(arr, ddof=1)), 3) if len(arr) > 1 else 0.0,
        }

    return {
        "available": True,
        "group_a": {"label": str(label_a), **describe(a)},
        "group_b": {"label": str(label_b), **describe(b)},
        "welch_t": round(float(t_stat), 3),
        "welch_p": round(float(t_p), 4),
        "welch_significant": bool(t_p < ALPHA),
        "mann_whitney_u": round(float(u_stat), 3) if u_stat is not None else None,
        "mann_whitney_p": round(float(u_p), 4) if u_p is not None else None,
        "mann_whitney_significant": bool(u_p is not None and u_p < ALPHA),
        "interpretation": (
            f"A statistically significant difference was found between {label_a} and {label_b} (p = {round(float(t_p), 4)})."
            if t_p < ALPHA else
            f"No statistically significant difference was found between {label_a} and {label_b} (p = {round(float(t_p), 4)})."
        ),
    }


def kruskal_wallis(values: pd.Series, groups: pd.Series) -> dict:
    df = pd.DataFrame({"value": values, "group": groups}).dropna()
    grouped = [g["value"].values for _, g in df.groupby("group") if len(g) > 0]
    labels = [name for name, g in df.groupby("group") if len(g) > 0]

    if len(grouped) < 2:
        return {"available": False, "reason": "Kruskal-Wallis requires at least 2 groups with data."}
    if any(len(g) < 2 for g in grouped):
        return {"available": False, "reason": "Insufficient sample size in one or more groups for reliable statistical inference."}

    try:
        h_stat, p = stats.kruskal(*grouped)
    except Exception as e:
        return {"available": False, "reason": f"Kruskal-Wallis test failed: {e}"}

    df_stat = len(grouped) - 1
    group_summaries = [
        {"label": str(labels[i]), "n": int(len(grouped[i])),
         "mean": round(float(np.mean(grouped[i])), 3),
         "sd": round(float(np.std(grouped[i], ddof=1)), 3) if len(grouped[i]) > 1 else 0.0}
        for i in range(len(grouped))
    ]

    return {
        "available": True,
        "H": round(float(h_stat), 3),
        "df": df_stat,
        "p": round(float(p), 4),
        "significant": bool(p < ALPHA),
        "groups": group_summaries,
        "interpretation": (
            f"A statistically significant difference was found across groups (H({df_stat}) = {round(float(h_stat), 2)}, p = {round(float(p), 4)})."
            if p < ALPHA else
            f"No statistically significant difference was found across groups (H({df_stat}) = {round(float(h_stat), 2)}, p = {round(float(p), 4)})."
        ),
    }
