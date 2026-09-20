"""
preview.py
Lightweight CLI used immediately after upload: loads the file, runs
validation, and returns a suggested column mapping — without running
the full statistical pipeline. Keeps the upload step fast and lets the
user confirm/adjust mapping before analysis runs.
"""
import sys
import json
import argparse

try:
    from .validation import load_dataset, validate_dataset
    from .mapping import auto_map_columns, DISSERTATION_MAPPING
    from .analysis import is_dissertation_file
except ImportError:
    from validation import load_dataset, validate_dataset
    from mapping import auto_map_columns, DISSERTATION_MAPPING
    from analysis import is_dissertation_file


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("file_path")
    args = parser.parse_args()

    try:
        df, sheet_info = load_dataset(args.file_path)
    except ValueError as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

    validation = validate_dataset(df)
    if sheet_info["multi_sheet"]:
        validation["checks"].append({
            "label": f"Multiple sheets detected ({', '.join(sheet_info['all_sheets'])}) — "
                     f"using '{sheet_info['sheet_used']}' (most data rows)",
            "status": "warn",
        })
        validation["warnings"].append(
            f"This workbook has {len(sheet_info['all_sheets'])} sheets: "
            f"{', '.join(sheet_info['all_sheets'])}. The sheet '{sheet_info['sheet_used']}' "
            f"was used because it has the most data rows "
            f"({sheet_info['sheet_row_counts']}). If this is the wrong sheet, "
            f"split it into its own file and re-upload."
        )
    mapping = DISSERTATION_MAPPING if is_dissertation_file(df) else auto_map_columns(df)
    is_default = is_dissertation_file(df)

    print(json.dumps({
        "validation": validation,
        "mapping": mapping,
        "is_dissertation_file": is_default,
        "row_count": len(df),
        "column_count": len(df.columns),
        "sheet_info": sheet_info,
    }, indent=2, default=str))


if __name__ == "__main__":
    main()
