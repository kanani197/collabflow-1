"""
text_analysis.py
Basic open-text analysis for the "biggest challenge" style free-text
column: response counts, a simple keyword frequency table, and the raw
response list. This is explicitly NOT presented as researcher-led
thematic analysis — see the "caveat" field every result carries.

For datasets with very few usable responses (as in the dissertation:
3 of 84), no thematic categorisation is attempted, matching the
dissertation's own approach in Chapter 4.10.
"""
import re
from collections import Counter

STOPWORDS = set("""
a an the and or but if is are was were be been being to of in on for with
as at by from this that these those it its i my me we our you your they
their he she his her not no yes can could would should will just also
using use used tool tools when where what which who how do does did
""".split())

MIN_USABLE_LENGTH = 3  # responses shorter than this (e.g. "Smile", "N/A") are not substantively informative


def analyze_open_text(series, min_responses_for_keywords: int = 10) -> dict:
    total_rows = len(series)
    non_null = series.dropna().astype(str).str.strip()
    non_null = non_null[non_null != ""]

    usable = non_null[non_null.str.split().str.len() >= MIN_USABLE_LENGTH]
    trivial = non_null[non_null.str.split().str.len() < MIN_USABLE_LENGTH]

    responses = [{"text": t, "word_count": len(t.split())} for t in non_null.tolist()]

    keyword_freq = []
    if len(usable) >= min_responses_for_keywords:
        words = []
        for text in usable:
            words.extend(re.findall(r"[a-zA-Z']+", text.lower()))
        words = [w for w in words if w not in STOPWORDS and len(w) > 2]
        counts = Counter(words)
        keyword_freq = [{"word": w, "count": c} for w, c in counts.most_common(20)]
        keyword_note = None
    else:
        keyword_note = (
            f"Only {len(usable)} substantively informative response(s) were found — "
            f"too few for a meaningful keyword frequency analysis. Showing the raw "
            f"responses instead."
        )

    return {
        "available": total_rows > 0,
        "total_rows": total_rows,
        "responses_received": int(len(non_null)),
        "usable_responses": int(len(usable)),
        "trivial_responses": int(len(trivial)),
        "missing_responses": int(total_rows - len(non_null)),
        "response_rate_pct": round(len(non_null) / total_rows * 100, 1) if total_rows else 0,
        "responses": responses,
        "keyword_frequency": keyword_freq,
        "keyword_note": keyword_note,
        "caveat": (
            "This is basic keyword-frequency text analysis, not researcher-led "
            "qualitative thematic analysis. With very few responses, no thematic "
            "categorisation should be inferred from word frequency alone."
        ),
    }
