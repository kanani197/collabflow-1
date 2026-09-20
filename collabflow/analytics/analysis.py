"""
analysis.py
Main orchestrator. Given a dataset (dataframe) + a column mapping,
runs the entire CollabFlow analytics pipeline and returns one
structured JSON result consumed by the dashboard.

Usage (CLI):
    python analysis.py <path_to_file> [--eligible] [--mapping mapping.json]

This module contains NO hard-coded dissertation numbers. Every value
in the output is calculated from whatever dataframe is passed in.
"""
import sys
import json
import argparse
import pandas as pd
import numpy as np

try:
    from .validation import load_dataset, validate_dataset, is_likert_series
    from .mapping import auto_map_columns, DISSERTATION_MAPPING
    from .descriptive import composite_score, categorical_summary, crosstab_summary, item_stats
    from .reliability import cronbach_alpha
    from .correlation import correlate_pair, shapiro_test
    from .comparison import two_group_comparison, kruskal_wallis
    from .text_analysis import analyze_open_text
    from .interview_data import get_interview_data
except ImportError:
    from validation import load_dataset, validate_dataset, is_likert_series
    from mapping import auto_map_columns, DISSERTATION_MAPPING
    from descriptive import composite_score, categorical_summary, crosstab_summary, item_stats
    from reliability import cronbach_alpha
    from correlation import correlate_pair, shapiro_test
    from comparison import two_group_comparison, kruskal_wallis
    from text_analysis import analyze_open_text
    from interview_data import get_interview_data

CONSTRUCTS = ["ux", "communication", "coordination", "performance"]
CONSTRUCT_LABELS = {"ux": "UX / Usability", "communication": "Communication",
                     "coordination": "Coordination", "performance": "Team Performance"}


def is_dissertation_file(df: pd.DataFrame) -> bool:
    cols = set(df.columns)
    fingerprint = "Q1. What is your current role? "
    return fingerprint in cols


def resolve_mapping(df: pd.DataFrame, override: dict = None) -> dict:
    if override:
        return override
    if is_dissertation_file(df):
        return DISSERTATION_MAPPING
    return auto_map_columns(df)


def apply_eligibility_filter(df: pd.DataFrame, mapping: dict, eligible_only: bool) -> tuple:
    """The dissertation's eligibility rule: exclude respondents reporting
    'Less than 3 months' hybrid/remote experience. Generalised: if a
    hybrid_experience column is mapped and eligible_only=True, drop rows
    whose value matches a 'less than 3 months'-style pattern."""
    exp_col = mapping.get("hybrid_experience", {}).get("column")
    if not eligible_only or not exp_col or exp_col not in df.columns:
        return df, 0
    mask = df[exp_col].astype(str).str.contains("less than 3", case=False, na=False)
    excluded = int(mask.sum())
    return df.loc[~mask].copy(), excluded


def build_construct_results(df: pd.DataFrame, mapping: dict) -> dict:
    results = {}
    for key in CONSTRUCTS:
        map_key = "ux_items" if key == "ux" else f"{key}_items"
        cols = mapping.get(map_key, {}).get("columns", [])
        reverse_cols = mapping.get("reverse_scored_items", [])
        comp = composite_score(df, cols, reverse_columns=reverse_cols)
        results[key] = comp
    return results


def run_pipeline(df: pd.DataFrame, mapping: dict = None, eligible_only: bool = False,
                  dataset_label: str = "Dataset") -> dict:
    mapping = resolve_mapping(df, mapping)
    validation_report = validate_dataset(df)

    filtered_df, excluded_count = apply_eligibility_filter(df, mapping, eligible_only)
    n_total = len(df)
    n_used = len(filtered_df)

    # ---- Demographics ----
    role_col = mapping.get("professional_role", {}).get("column")
    tech_col = mapping.get("technical_status", {}).get("column")
    exp_col = mapping.get("hybrid_experience", {}).get("column")
    tool_col = mapping.get("primary_tool", {}).get("column")
    purpose_col = mapping.get("tool_purpose", {}).get("column")

    demographics = {
        "professional_role": categorical_summary(filtered_df, role_col) if role_col else {"available": False, "reason": "Variable not available in uploaded dataset."},
        "technical_status": categorical_summary(filtered_df, tech_col) if tech_col else {"available": False, "reason": "Variable not available in uploaded dataset."},
        "hybrid_experience": categorical_summary(filtered_df, exp_col) if exp_col else {"available": False, "reason": "Variable not available in uploaded dataset."},
    }

    # ---- Tool usage ----
    tool_summary = categorical_summary(filtered_df, tool_col) if tool_col else {"available": False, "reason": "Variable not available in uploaded dataset."}
    tool_purpose_summary = categorical_summary(filtered_df, purpose_col) if purpose_col else {"available": False, "reason": "Variable not available in uploaded dataset."}
    tool_by_role = crosstab_summary(filtered_df, tool_col, role_col) if tool_col and role_col else {"available": False}
    most_used_tool = tool_summary["categories"][0]["label"] if tool_summary.get("available") and tool_summary["categories"] else None

    # ---- Construct composites (UX, Comm, Coord, Perf) ----
    constructs = build_construct_results(filtered_df, mapping)

    # composite series stored for correlation/comparison use
    composite_series = {}
    for key, res in constructs.items():
        composite_series[key] = res.get("composite_series") if res.get("available") else None

    # ---- Reliability (Cronbach's alpha) ----
    reliability = {}
    for key in CONSTRUCTS:
        map_key = "ux_items" if key == "ux" else f"{key}_items"
        cols = mapping.get(map_key, {}).get("columns", [])
        reverse_cols = set(mapping.get("reverse_scored_items", []))
        valid_cols = [c for c in cols if c in filtered_df.columns]
        if len(valid_cols) >= 2:
            working = pd.DataFrame(index=filtered_df.index)
            for c in valid_cols:
                s = pd.to_numeric(filtered_df[c], errors="coerce")
                if c in reverse_cols:
                    s = 6 - s
                working[c] = s
            reliability[key] = cronbach_alpha(working)
        else:
            reliability[key] = {"available": False, "reason": "At least 2 items are required to calculate Cronbach's alpha."}

    # ---- Normality ----
    normality = {}
    for key in CONSTRUCTS:
        series = composite_series.get(key)
        normality[key] = shapiro_test(series) if series is not None else {"available": False, "reason": "Composite not available."}

    # ---- Correlation matrix (all construct pairs) ----
    pairs = [("ux", "communication"), ("ux", "coordination"), ("ux", "performance"),
              ("communication", "coordination"), ("communication", "performance"),
              ("coordination", "performance")]
    correlations = []
    for a, b in pairs:
        sa, sb = composite_series.get(a), composite_series.get(b)
        if sa is None or sb is None:
            correlations.append({"pair": f"{a}-{b}", "available": False,
                                  "reason": "One or both composite scores unavailable."})
        else:
            correlations.append(correlate_pair(CONSTRUCT_LABELS[a], sa, CONSTRUCT_LABELS[b], sb))

    # ---- Technical vs Non-technical comparison ----
    tech_comparison = {}
    if tech_col and tech_col in filtered_df.columns:
        for key in CONSTRUCTS:
            series = composite_series.get(key)
            if series is not None:
                tech_comparison[key] = two_group_comparison(series, filtered_df[tech_col])
            else:
                tech_comparison[key] = {"available": False, "reason": "Composite not available."}
    else:
        tech_comparison = {"available": False, "reason": "Variable not available in uploaded dataset."}

    # ---- Tool comparison (Kruskal-Wallis) ----
    tool_comparison = {}
    if tool_col and tool_col in filtered_df.columns:
        for key in CONSTRUCTS:
            series = composite_series.get(key)
            if series is not None:
                tool_comparison[key] = kruskal_wallis(series, filtered_df[tool_col])
            else:
                tool_comparison[key] = {"available": False, "reason": "Composite not available."}
    else:
        tool_comparison = {"available": False, "reason": "Variable not available in uploaded dataset."}

    # ---- KPIs ----
    kpis = {
        "total_respondents": n_used,
        "excluded_by_eligibility": excluded_count,
        "technical_count": next((c["count"] for c in demographics["technical_status"].get("categories", [])
                                  if "non" not in c["label"].lower()), None) if demographics["technical_status"].get("available") else None,
        "non_technical_count": next((c["count"] for c in demographics["technical_status"].get("categories", [])
                                      if "non" in c["label"].lower()), None) if demographics["technical_status"].get("available") else None,
        "most_used_tool": most_used_tool,
        "ux_mean": constructs["ux"].get("composite_stats", {}).get("mean") if constructs["ux"].get("available") else None,
        "communication_mean": constructs["communication"].get("composite_stats", {}).get("mean") if constructs["communication"].get("available") else None,
        "coordination_mean": constructs["coordination"].get("composite_stats", {}).get("mean") if constructs["coordination"].get("available") else None,
        "performance_mean": constructs["performance"].get("composite_stats", {}).get("mean") if constructs["performance"].get("available") else None,
        "significant_correlations": sum(1 for c in correlations if c.get("available") and c.get("significant")),
        "total_missing_values": validation_report["total_missing"],
    }

    # ---- Insights engine (auto-generated from p-values, no hardcoding) ----
    insights = []
    for c in correlations:
        if not c.get("available"):
            continue
        a_label, b_label = c["variable_a"], c["variable_b"]
        if c["significant"]:
            insights.append({"type": "positive" if c["coefficient"] and c["coefficient"] > 0 else "finding",
                              "text": f"{a_label} shows a statistically significant association with {b_label} "
                                      f"({c['primary_method'].title()} = {c['coefficient']}, p = {c['p_value']})."})
        else:
            insights.append({"type": "caution",
                              "text": f"No statistically significant association was found between {a_label} and {b_label} "
                                      f"({c['primary_method'].title()} = {c['coefficient']}, p = {c['p_value']})."})

    for key in CONSTRUCTS:
        rel = reliability.get(key, {})
        if rel.get("available") and rel.get("flag_low"):
            insights.append({"type": "caution",
                              "text": f"The {CONSTRUCT_LABELS[key]} scale showed low internal consistency "
                                      f"(Cronbach's alpha = {rel['alpha']}) in this dataset. Composite scores "
                                      f"for this construct should be interpreted cautiously."})

    if excluded_count > 0:
        insights.append({"type": "caution",
                          "text": f"{excluded_count} respondents did not meet the stated eligibility criterion "
                                  f"and are excluded when 'Eligible Dataset' is selected. Results may differ "
                                  f"between the full and eligible samples."})

    # ---- Recommendations engine (heuristic, evidence-linked, non-causal) ----
    recommendations = []
    if constructs["communication"].get("available") and constructs["communication"]["composite_stats"].get("mean") is not None:
        if constructs["communication"]["composite_stats"]["mean"] < 3.0:
            recommendations.append({
                "label": "Data-informed recommendation",
                "text": "Communication scores in this dataset fall below the scale midpoint. "
                        "Consider reviewing communication workflows and channel structure."})
    if constructs["coordination"].get("available") and constructs["coordination"]["composite_stats"].get("mean") is not None:
        if constructs["coordination"]["composite_stats"]["mean"] < 3.0:
            recommendations.append({
                "label": "Data-informed recommendation",
                "text": "Coordination scores fall below the scale midpoint. Consider reducing "
                        "cross-platform information fragmentation and improving task-tracking integration."})
    perf_corr = next((c for c in correlations if c.get("available") and "Coordination" in (c.get("variable_a"), c.get("variable_b"))
                       and "Performance" in (c.get("variable_a"), c.get("variable_b"))), None)
    if perf_corr and perf_corr.get("significant"):
        recommendations.append({
            "label": "Data-informed recommendation",
            "text": "Coordination is significantly associated with perceived performance in this dataset. "
                    "Consider prioritising coordination and task-tracking improvements over interface-level "
                    "usability changes alone."})
    if not recommendations:
        recommendations.append({
            "label": "Data-informed recommendation",
            "text": "No construct scored consistently below the scale midpoint, and no dominant significant "
                    "association emerged. Review individual charts for role- or tool-specific patterns."})

    # ---- Open-text (challenge) analysis ----
    open_col = mapping.get("open_feedback", {}).get("column")
    if open_col and open_col in filtered_df.columns:
        open_text_result = analyze_open_text(filtered_df[open_col])
    else:
        open_text_result = {"available": False, "reason": "Variable not available in uploaded dataset."}

    # ---- Interview data (dissertation-specific qualitative record) ----
    interview_result = get_interview_data(is_dissertation_file(df))

    # ---- Feature-level analysis (honest proxy-only framing) ----
    # The dissertation's instrument does not separately operationalise
    # notifications/search/integrations as distinct variables. Q7
    # (feature integration) and Q15 (findability) are the closest
    # available proxies. We surface them explicitly as proxies, and
    # never claim to statistically identify "the most influential
    # feature" from a two-item, non-exhaustive set.
    feature_proxies = []
    ux_cols = mapping.get("ux_items", {}).get("columns", [])
    coord_cols = mapping.get("coordination_items", {}).get("columns", [])
    # Heuristic: an "integration" item is the 2nd UX item in the dissertation
    # instrument order; a "findability" item is the 2nd coordination item.
    # For arbitrary uploads we fall back to whatever is mapped.
    candidate_cols = []
    if len(ux_cols) >= 2:
        candidate_cols.append(("Feature integration (proxy)", ux_cols[1]))
    if len(coord_cols) >= 2:
        candidate_cols.append(("Information findability (proxy)", coord_cols[1]))
    for label, col in candidate_cols:
        if col in filtered_df.columns:
            stats = item_stats(filtered_df, col)
            if stats:
                stats["proxy_label"] = label
                feature_proxies.append(stats)

    feature_analysis = {
        "available": len(feature_proxies) > 0,
        "proxies": feature_proxies,
        "note": (
            "This survey instrument did not separately operationalise individual "
            "features (e.g. notifications, search, integrations) as distinct "
            "variables. Feature-level evidence is limited to the proxies below; "
            "no single feature can be statistically identified as most influential "
            "from this dataset."
        ),
    }

    return {
        "dataset_label": dataset_label,
        "mapping_used": mapping,
        "validation": validation_report,
        "sample": {"n_total_uploaded": n_total, "n_used": n_used, "excluded_by_eligibility": excluded_count,
                   "eligible_filter_applied": eligible_only},
        "kpis": kpis,
        "demographics": demographics,
        "tool_usage": {"summary": tool_summary, "purpose": tool_purpose_summary, "by_role": tool_by_role},
        "constructs": {k: {kk: vv for kk, vv in v.items() if kk != "composite_series"} for k, v in constructs.items()},
        "reliability": reliability,
        "normality": normality,
        "correlations": correlations,
        "technical_vs_nontechnical": tech_comparison,
        "tool_comparison": tool_comparison,
        "insights": insights,
        "recommendations": recommendations,
        "open_text": open_text_result,
        "interview": interview_result,
        "feature_analysis": feature_analysis,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("file_path")
    parser.add_argument("--eligible", action="store_true")
    parser.add_argument("--label", default="Dataset")
    args = parser.parse_args()

    df = load_dataset(args.file_path)[0]
    result = run_pipeline(df, eligible_only=args.eligible, dataset_label=args.label)
    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()
