"""
export_csv.py
Outputs the current dataset, cleaned (duplicates flagged, not silently
dropped) and with composite scores appended, as CSV to stdout.
"""
import sys
import argparse
import pandas as pd

try:
    from .validation import load_dataset
    from .mapping import auto_map_columns, DISSERTATION_MAPPING
    from .analysis import is_dissertation_file, apply_eligibility_filter, build_construct_results
except ImportError:
    from validation import load_dataset
    from mapping import auto_map_columns, DISSERTATION_MAPPING
    from analysis import is_dissertation_file, apply_eligibility_filter, build_construct_results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("file_path")
    parser.add_argument("--eligible", action="store_true")
    args = parser.parse_args()

    df = load_dataset(args.file_path)[0]
    mapping = DISSERTATION_MAPPING if is_dissertation_file(df) else auto_map_columns(df)
    filtered_df, _ = apply_eligibility_filter(df, mapping, args.eligible)

    constructs = build_construct_results(filtered_df, mapping)
    out = filtered_df.copy()
    for key, res in constructs.items():
        if res.get("available") and res.get("composite_series") is not None:
            out[f"{key}_composite"] = res["composite_series"]

    sys.stdout.write(out.to_csv(index=False))


if __name__ == "__main__":
    main()
