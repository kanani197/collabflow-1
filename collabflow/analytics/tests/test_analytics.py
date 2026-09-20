"""
test_analytics.py
Unit tests for the CollabFlow analytics engine, plus the critical
end-to-end validation test that reproduces the dissertation's reported
Chapter 4 results from the raw Excel dataset.

Run with:  cd analytics && python -m pytest tests/ -v
"""
import os
import sys
import math
import pandas as pd
import numpy as np
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from validation import load_dataset, validate_dataset, is_likert_series
from mapping import auto_map_columns, DISSERTATION_MAPPING
from descriptive import reverse_score, composite_score, item_stats
from reliability import cronbach_alpha
from correlation import correlate_pair, shapiro_test
from comparison import two_group_comparison, kruskal_wallis
from analysis import run_pipeline, is_dissertation_file

DEFAULT_DATASET = os.path.join(
    os.path.dirname(__file__), "..", "..", "data", "default", "dissertation_dataset.xlsx"
)


def close(a, b, tol=0.06):
    return a is not None and abs(a - b) < tol


# ---------- Unit tests ----------

def test_is_likert_series():
    assert is_likert_series(pd.Series([1, 2, 3, 4, 5]))
    assert not is_likert_series(pd.Series([1, 2, 3, 4, 5, 6]))
    assert not is_likert_series(pd.Series(["a", "b"]))


def test_reverse_score():
    s = pd.Series([1, 2, 3, 4, 5])
    r = reverse_score(s)
    assert r.tolist() == [5, 4, 3, 2, 1]


def test_composite_score_requires_items():
    df = pd.DataFrame({"a": [1, 2, 3]})
    result = composite_score(df, [])
    assert result["available"] is False


def test_cronbach_alpha_requires_two_items():
    df = pd.DataFrame({"a": [1, 2, 3]})
    result = cronbach_alpha(df)
    assert result["available"] is False


def test_cronbach_alpha_perfect_correlation():
    # Identical items -> alpha should be very high
    df = pd.DataFrame({"a": [1, 2, 3, 4, 5], "b": [1, 2, 3, 4, 5]})
    result = cronbach_alpha(df)
    assert result["available"] is True
    assert result["alpha"] > 0.9


def test_two_group_comparison_insufficient_groups():
    values = pd.Series([1, 2, 3])
    groups = pd.Series(["A", "A", "A"])
    result = two_group_comparison(values, groups)
    assert result["available"] is False


def test_kruskal_wallis_basic():
    values = pd.Series([1, 2, 3, 4, 5, 6, 7, 8, 9])
    groups = pd.Series(["A", "A", "A", "B", "B", "B", "C", "C", "C"])
    result = kruskal_wallis(values, groups)
    assert result["available"] is True
    assert "H" in result and "p" in result


def test_load_dataset_picks_largest_sheet(tmp_path):
    """A workbook with a small leftover/template sheet plus a larger
    data sheet should load the LARGER sheet, not just the first one."""
    small_df = pd.DataFrame({"A": [1, 2, 3]})
    big_df = pd.DataFrame({"A": list(range(50))})
    file_path = tmp_path / "multi_sheet.xlsx"
    with pd.ExcelWriter(file_path) as writer:
        small_df.to_excel(writer, sheet_name="Sheet1", index=False)
        big_df.to_excel(writer, sheet_name="RealData", index=False)

    df, sheet_info = load_dataset(str(file_path))
    assert len(df) == 50
    assert sheet_info["multi_sheet"] is True
    assert sheet_info["sheet_used"] == "RealData"


def test_load_dataset_single_sheet_unaffected(tmp_path):
    """A normal single-sheet workbook should load exactly as before."""
    df_in = pd.DataFrame({"A": [1, 2, 3]})
    file_path = tmp_path / "single_sheet.xlsx"
    df_in.to_excel(file_path, index=False)

    df, sheet_info = load_dataset(str(file_path))
    assert len(df) == 3
    assert sheet_info["multi_sheet"] is False


def test_auto_map_columns_generalizes():
    """Auto-mapping should work on a dataset with completely different
    column names/wording from the dissertation."""
    df = pd.DataFrame({
        "Job Role": ["Engineer"] * 10,
        "Tool Used": ["Slack"] * 5 + ["Zoom"] * 5,
        "Ease of use rating": np.random.randint(1, 6, 10),
        "Interface integration rating": np.random.randint(1, 6, 10),
        "Quick to learn rating": np.random.randint(1, 6, 10),
        "Confident using tool": np.random.randint(1, 6, 10),
        "Clear communication rating": np.random.randint(1, 6, 10),
        "Evenly distributed communication": np.random.randint(1, 6, 10),
    })
    mapping = auto_map_columns(df)
    assert len(mapping["ux_items"]["columns"]) == 4
    assert len(mapping["communication_items"]["columns"]) == 2
    assert mapping["primary_tool"]["column"] == "Tool Used"


# ---------- Critical validation test: reproduce dissertation results ----------

@pytest.mark.skipif(not os.path.exists(DEFAULT_DATASET), reason="Default dataset not present")
class TestDissertationValidation:
    """Verifies the analytics engine reproduces every statistic reported
    in Chapter 4 of the dissertation, calculated fresh from the raw
    Excel file — nothing here is hard-coded in analysis.py itself."""

    @classmethod
    def setup_class(cls):
        cls.df, _ = load_dataset(DEFAULT_DATASET)
        cls.full = run_pipeline(cls.df, eligible_only=False, dataset_label="Dissertation Dataset")
        cls.eligible = run_pipeline(cls.df, eligible_only=True, dataset_label="Dissertation Dataset")

    def test_is_recognized_as_dissertation_file(self):
        assert is_dissertation_file(self.df) is True

    def test_full_sample_size(self):
        assert self.full["sample"]["n_used"] == 84

    def test_eligible_sample_size(self):
        assert self.eligible["sample"]["n_used"] == 61
        assert self.eligible["sample"]["excluded_by_eligibility"] == 23

    def test_tool_frequencies(self):
        cats = {c["label"]: c["count"] for c in self.full["tool_usage"]["summary"]["categories"]}
        assert cats["Microsoft Teams"] == 44
        assert cats["Slack"] == 22
        assert cats["Zoom"] == 18

    def test_composite_means(self):
        kpis = self.full["kpis"]
        assert close(kpis["ux_mean"], 2.80)
        assert close(kpis["communication_mean"], 2.73)
        assert close(kpis["coordination_mean"], 2.59)
        assert close(kpis["performance_mean"], 2.70)

    def test_spearman_correlations_full_sample(self):
        targets = {
            ("UX / Usability", "Communication"): 0.234,
            ("UX / Usability", "Coordination"): 0.229,
            ("UX / Usability", "Team Performance"): 0.182,
            ("Communication", "Coordination"): 0.214,
            ("Communication", "Team Performance"): 0.054,
            ("Coordination", "Team Performance"): 0.249,
        }
        by_pair = {(c["variable_a"], c["variable_b"]): c for c in self.full["correlations"] if c.get("available")}
        for (a, b), expected in targets.items():
            calc = by_pair[(a, b)]["spearman_rho"]
            assert close(calc, expected), f"{a}-{b}: calc={calc} expected={expected}"

    def test_kruskal_wallis_tool_comparison(self):
        targets = {"ux": (7.05, 0.029), "communication": (6.71, 0.035),
                   "coordination": (5.39, 0.068), "performance": (1.52, 0.467)}
        for key, (h_exp, p_exp) in targets.items():
            res = self.full["tool_comparison"][key]
            assert close(res["H"], h_exp)
            assert close(res["p"], p_exp)

    def test_cronbach_alpha_values(self):
        targets = {"ux": 0.06, "communication": 0.11, "coordination": -0.18, "performance": 0.45}
        for key, expected in targets.items():
            calc = self.full["reliability"][key]["alpha"]
            assert close(calc, expected)

    def test_low_alpha_is_flagged(self):
        assert self.full["reliability"]["ux"]["flag_low"] is True

    def test_ux_scale_labelled_adapted_not_official_sus(self):
        # This is a UI-layer requirement, but the item count (6, not 10)
        # is the structural fact the UI label depends on.
        assert self.full["constructs"]["ux"]["n_items"] == 6

    def test_open_text_matches_reported_response_counts(self):
        ot = self.full["open_text"]
        assert ot["responses_received"] == 3
        assert ot["usable_responses"] == 2

    def test_interview_data_available_for_dissertation_file(self):
        interview = self.full["interview"]
        assert interview["available"] is True
        assert interview["participant"]["label"] == "P1"
        assert len(interview["themes"]) == 5

    def test_interview_data_unavailable_for_other_datasets(self):
        from interview_data import get_interview_data
        result = get_interview_data(is_dissertation_file=False)
        assert result["available"] is False

    def test_feature_analysis_never_claims_single_best_feature(self):
        fa = self.full["feature_analysis"]
        assert fa["available"] is True
        assert "no single feature" in fa["note"].lower()
