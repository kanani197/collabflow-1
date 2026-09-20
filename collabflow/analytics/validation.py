"""
validation.py
Loads an uploaded Excel/CSV file (or the default dissertation dataset),
runs data-quality checks, and detects candidate columns for smart mapping.

No statistics are calculated here — this module only inspects structure.
"""
import pandas as pd
import numpy as np
import re

PII_PATTERNS = ["name", "email", "e-mail", "phone", "mobile", "address",
                "employee id", "employee_id", "ssn", "national insurance"]

LIKERT_MIN, LIKERT_MAX = 1, 5


def load_dataset(file_path: str) -> tuple:
    """Load an .xlsx or .csv file into a DataFrame. Raises ValueError on failure.

    Returns (DataFrame, sheet_info) where sheet_info is a dict describing
    which sheet was used (for .xlsx/.xls) and what other sheets exist, so
    a workbook with multiple sheets doesn't silently analyse the wrong
    one. When more than one sheet is present, the sheet with the most
    populated data rows is selected — not simply the first sheet — since
    it's common for a workbook to carry a leftover/template first sheet
    while the actual data lives elsewhere.
    """
    sheet_info = {"multi_sheet": False, "sheet_used": None, "all_sheets": [], "sheet_row_counts": {}}

    if file_path.lower().endswith((".xlsx", ".xls")):
        try:
            all_sheets = pd.read_excel(file_path, sheet_name=None)
        except Exception as e:
            raise ValueError(f"Could not read Excel file: {e}")

        sheet_names = list(all_sheets.keys())
        sheet_info["all_sheets"] = sheet_names
        sheet_info["multi_sheet"] = len(sheet_names) > 1

        if len(sheet_names) == 1:
            df = all_sheets[sheet_names[0]]
            sheet_info["sheet_used"] = sheet_names[0]
        else:
            # Pick the sheet with the most non-empty rows, breaking ties
            # by column count (more columns = more likely the real data).
            row_counts = {}
            best_name, best_df, best_score = None, None, (-1, -1)
            for name, sheet_df in all_sheets.items():
                cleaned = sheet_df.dropna(axis=0, how="all")
                score = (len(cleaned), sheet_df.shape[1])
                row_counts[name] = len(cleaned)
                if score > best_score:
                    best_name, best_df, best_score = name, sheet_df, score
            df = best_df
            sheet_info["sheet_used"] = best_name
            sheet_info["sheet_row_counts"] = row_counts
    elif file_path.lower().endswith(".csv"):
        try:
            df = pd.read_csv(file_path)
        except Exception as e:
            raise ValueError(f"Could not read CSV file: {e}")
    else:
        raise ValueError("Unsupported file type. Please upload .xlsx or .csv")

    if df.empty or df.shape[1] == 0:
        raise ValueError("The uploaded file contains no data.")

    # Drop fully-empty columns/rows (common in Google Forms exports)
    df = df.dropna(axis=1, how="all")
    df = df.dropna(axis=0, how="all")
    return df, sheet_info


def detect_pii(columns) -> list:
    """Flag column names that look like they might contain PII."""
    flagged = []
    for col in columns:
        low = str(col).lower()
        if any(p in low for p in PII_PATTERNS):
            flagged.append(col)
    return flagged


def is_likert_series(series: pd.Series) -> bool:
    """A column counts as Likert-like if it is numeric and all non-null
    values fall within [LIKERT_MIN, LIKERT_MAX] as whole numbers."""
    numeric = pd.to_numeric(series, errors="coerce")
    valid = numeric.dropna()
    if len(valid) == 0:
        return False
    if not np.all(np.mod(valid, 1) == 0):
        return False
    return valid.between(LIKERT_MIN, LIKERT_MAX).all()


def column_profile(df: pd.DataFrame) -> list:
    """Build a structural profile of every column for the mapping UI and
    the validation report."""
    profile = []
    for col in df.columns:
        series = df[col]
        missing = int(series.isna().sum())
        n_unique = int(series.nunique(dropna=True))
        likert = is_likert_series(series)

        if likert:
            dtype = "likert"
        elif pd.api.types.is_numeric_dtype(series):
            dtype = "numeric"
        elif pd.api.types.is_datetime64_any_dtype(series):
            dtype = "datetime"
        elif n_unique <= max(15, int(0.3 * len(df))):
            dtype = "categorical"
        else:
            dtype = "text"

        sample_values = series.dropna().unique().tolist()[:8]
        profile.append({
            "column": str(col),
            "dtype": dtype,
            "missing": missing,
            "missing_pct": round(missing / len(df) * 100, 1) if len(df) else 0,
            "unique_values": n_unique,
            "sample_values": [str(v) for v in sample_values],
        })
    return profile


def validate_dataset(df: pd.DataFrame) -> dict:
    """Run the full validation checklist and return a structured report."""
    checks = []
    warnings = []
    errors = []

    n_rows, n_cols = df.shape
    checks.append({"label": f"{n_rows} rows detected", "status": "pass"})
    checks.append({"label": f"{n_cols} columns detected", "status": "pass"})

    if n_rows < 10:
        warnings.append("Sample size is very small (<10 rows). Statistical "
                         "tests will have limited reliability.")

    dup_count = int(df.duplicated().sum())
    if dup_count > 0:
        checks.append({"label": f"{dup_count} duplicate rows detected", "status": "warn"})
        warnings.append(f"{dup_count} duplicate rows were found. They were not "
                         f"removed automatically; review the Data Preview page.")
    else:
        checks.append({"label": "No duplicate rows", "status": "pass"})

    total_missing = int(df.isna().sum().sum())
    if total_missing > 0:
        checks.append({"label": f"{total_missing} missing values detected", "status": "warn"})
    else:
        checks.append({"label": "No missing values detected", "status": "pass"})

    likert_cols = [c for c in df.columns if is_likert_series(df[c])]
    if likert_cols:
        checks.append({"label": f"{len(likert_cols)} Likert-scale (1-5) columns identified", "status": "pass"})
    else:
        warnings.append("No Likert-scale (1-5) columns were detected. UX, "
                         "communication, coordination, and performance analyses "
                         "will be unavailable until columns are mapped.")

    pii_flags = detect_pii(df.columns)
    if pii_flags:
        warnings.append(f"Columns that may contain personally identifiable "
                         f"information were detected: {', '.join(map(str, pii_flags))}. "
                         f"Please confirm you have permission to analyse this data.")

    status = "ready" if not errors else "blocked"
    if not likert_cols:
        status = "limited"

    return {
        "status": status,
        "n_rows": n_rows,
        "n_cols": n_cols,
        "duplicate_rows": dup_count,
        "total_missing": total_missing,
        "likert_columns_detected": len(likert_cols),
        "checks": checks,
        "warnings": warnings,
        "errors": errors,
        "pii_flags": pii_flags,
        "column_profile": column_profile(df),
    }
