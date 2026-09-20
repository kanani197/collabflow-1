"""
reliability.py
Cronbach's alpha for a multi-item scale, computed from the (already
reverse-scored) working item matrix.
"""
import numpy as np
import pandas as pd


def cronbach_alpha(item_df: pd.DataFrame) -> dict:
    """item_df: rows = respondents, columns = items (already reverse-scored
    where applicable). Returns None-safe dict; requires >=2 items and
    >=2 complete-case rows."""
    data = item_df.dropna()
    n_items = data.shape[1]
    n_obs = data.shape[0]

    if n_items < 2:
        return {"available": False, "reason": "At least 2 items are required to calculate Cronbach's alpha."}
    if n_obs < 2:
        return {"available": False, "reason": "Insufficient complete cases to calculate Cronbach's alpha."}

    item_variances = data.var(axis=0, ddof=1)
    total_scores = data.sum(axis=1)
    total_variance = total_scores.var(ddof=1)

    if total_variance == 0:
        return {"available": False, "reason": "Zero variance in total scores; alpha is undefined."}

    alpha = (n_items / (n_items - 1)) * (1 - item_variances.sum() / total_variance)
    alpha = round(float(alpha), 3)

    if alpha >= 0.9:
        interpretation = "Excellent internal consistency"
    elif alpha >= 0.8:
        interpretation = "Good internal consistency"
    elif alpha >= 0.7:
        interpretation = "Acceptable internal consistency"
    elif alpha >= 0.5:
        interpretation = "Weak internal consistency — interpret composite scores cautiously"
    else:
        interpretation = "Very weak / unreliable — items do not function as a statistically sound scale in this sample"

    return {
        "available": True,
        "n_items": n_items,
        "n_obs": n_obs,
        "alpha": alpha,
        "interpretation": interpretation,
        "flag_low": alpha < 0.7,
    }
