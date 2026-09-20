"""
mapping.py
Smart column mapping: guesses which columns in an arbitrary uploaded
dataset correspond to the variables CollabFlow's analytics need
(role, technical status, hybrid experience, tool, and the four Likert
blocks: UX, Communication, Coordination, Performance).

This never assumes a fixed schema. It scores columns by keyword overlap
with each target variable and, for the Likert blocks, by column order
and the specific dissertation wording. Every suggested mapping is
returned with a confidence flag so the frontend can show
"auto-mapped" / "needs confirmation" / "missing" and let a human
confirm or override it.
"""
import re
try:
    from .validation import is_likert_series
except ImportError:
    from validation import is_likert_series

# Keyword hints. These are patterns to look for in column headers.
ROLE_HINTS = ["role", "job title", "position", "job role", "profession"]
TECH_STATUS_HINTS = ["technical", "classify your role", "tech status", "technical/non-technical"]
HYBRID_EXPERIENCE_HINTS = ["hybrid", "remote", "how long", "experience working", "tenure"]
TOOL_HINTS = ["tool", "platform", "which digital collaboration", "app used", "software used"]
TOOL_PURPOSE_HINTS = ["primarily use", "purpose", "used for", "main use"]
OPEN_TEXT_HINTS = ["challenge", "comment", "feedback", "improve", "biggest issue"]

# Wording fingerprints that map cleanly onto the dissertation's four constructs.
# Each entry is a single keyword/short-phrase; matching is done at the
# word level (see _score) so variants like "ease of use" and "easy to
# use" both score against "easy" / "ease" / "use".
UX_HINTS = ["easy", "ease", "use", "usable", "usability", "feature", "features",
            "integrated", "integration", "learn", "quick", "confident",
            "confidence", "complex", "complicated", "interface", "ux", "sus"]
COMM_HINTS = ["communication", "communicate", "clear", "timely", "distributed",
              "shared", "message", "messaging"]
COORD_HINTS = ["coordinate", "coordination", "track", "progress", "find",
               "discussion", "discussions", "knowledge", "search", "locate"]
PERF_HINTS = ["productivity", "productive", "performance", "goal", "goals",
              "achieve", "output", "effective", "effectiveness"]

REVERSE_HINTS = ["reverse", "unnecessarily", "complex", "complicated", "lot"]


def _tokenize(text: str) -> set:
    return set(re.findall(r"[a-z]+", text.lower()))


def _score(col_name: str, hints: list) -> int:
    """Word-level overlap score: counts how many hint words appear as
    whole words in the column name (handles punctuation/casing/plurals
    loosely without needing exact phrase matches)."""
    tokens = _tokenize(str(col_name))
    return sum(1 for h in hints if h in tokens)


def _best_match(columns, hints, exclude=None):
    exclude = exclude or set()
    best_col, best_score = None, 0
    for col in columns:
        if col in exclude:
            continue
        s = _score(str(col), hints)
        if s > best_score:
            best_col, best_score = col, s
    return best_col, best_score


def auto_map_columns(df) -> dict:
    """Return a suggested mapping plus confidence for each app variable."""
    columns = list(df.columns)
    likert_cols = [c for c in columns if is_likert_series(df[c])]
    used = set()
    mapping = {}

    def assign(key, col, score, min_score=1):
        status = "auto" if score >= min_score else "missing"
        mapping[key] = {"column": col, "status": status if col else "missing", "confidence": score}
        if col:
            used.add(col)

    role_col, s = _best_match(columns, ROLE_HINTS, used)
    assign("professional_role", role_col, s)

    tech_col, s = _best_match(columns, TECH_STATUS_HINTS, used)
    assign("technical_status", tech_col, s)

    exp_col, s = _best_match(columns, HYBRID_EXPERIENCE_HINTS, used)
    assign("hybrid_experience", exp_col, s)

    tool_col, s = _best_match(columns, TOOL_HINTS, used)
    assign("primary_tool", tool_col, s)

    purpose_col, s = _best_match(columns, TOOL_PURPOSE_HINTS, used)
    assign("tool_purpose", purpose_col, s)

    open_col, s = _best_match(columns, OPEN_TEXT_HINTS, used)
    assign("open_feedback", open_col, s)

    # Likert blocks: score every remaining Likert column against each
    # construct's wording fingerprint, then assign highest-scoring first.
    remaining_likert = [c for c in likert_cols if c not in used]

    def collect_block(hints, min_needed=2):
        scored = [(c, _score(str(c), hints)) for c in remaining_likert if c not in used]
        scored = [x for x in scored if x[1] > 0]
        scored.sort(key=lambda x: -x[1])
        chosen = [c for c, sc in scored]
        for c in chosen:
            used.add(c)
        return chosen

    ux_cols = collect_block(UX_HINTS)
    comm_cols = collect_block(COMM_HINTS)
    coord_cols = collect_block(COORD_HINTS)
    perf_cols = collect_block(PERF_HINTS)

    # Fallback: if wording didn't match (e.g. generic "Q1, Q2..." headers),
    # fall back to positional grouping of leftover Likert columns in
    # blocks of similar size to the dissertation instrument (6/2/2/2).
    leftover = [c for c in remaining_likert if c not in used]
    if not ux_cols and not comm_cols and not coord_cols and not perf_cols and leftover:
        chunk_sizes = [6, 2, 2, 2]
        idx = 0
        blocks = []
        for size in chunk_sizes:
            blocks.append(leftover[idx:idx + size])
            idx += size
        ux_cols, comm_cols, coord_cols, perf_cols = (blocks + [[], [], [], []])[:4]
        for block in (ux_cols, comm_cols, coord_cols, perf_cols):
            for c in block:
                used.add(c)

    reverse_cols = [c for c in ux_cols + comm_cols + coord_cols + perf_cols
                    if _score(str(c), REVERSE_HINTS) > 0]

    mapping["ux_items"] = {"columns": ux_cols, "status": "auto" if ux_cols else "missing"}
    mapping["communication_items"] = {"columns": comm_cols, "status": "auto" if comm_cols else "missing"}
    mapping["coordination_items"] = {"columns": coord_cols, "status": "auto" if coord_cols else "missing"}
    mapping["performance_items"] = {"columns": perf_cols, "status": "auto" if perf_cols else "missing"}
    mapping["reverse_scored_items"] = reverse_cols
    mapping["unmapped_likert_columns"] = [c for c in likert_cols if c not in used]

    return mapping


# Exact, verified mapping for the bundled dissertation dataset. Using the
# real header text avoids relying on fuzzy matching for the default demo,
# while uploaded files still go through auto_map_columns() above.
DISSERTATION_MAPPING = {
    "professional_role": {"column": "Q1. What is your current role? ", "status": "auto"},
    "technical_status": {"column": "Q2. How would you classify your role? ", "status": "auto"},
    "hybrid_experience": {"column": "Q3. How long have you been working in a hybrid or remote arrangement? ", "status": "auto"},
    "primary_tool": {"column": "Q4. Which digital collaboration tool do you use most frequently for work? ", "status": "auto"},
    "tool_purpose": {"column": "Q5. What do you primarily use this tool for? ", "status": "auto"},
    "open_feedback": {"column": "Q18. What is the biggest challenge you face when using this tool for interdisciplinary collaboration? ", "status": "auto"},
    "ux_items": {"columns": [
        "Q6. I think this tool is easy to use. ",
        "Q7.  I find the various features of this tool well integrated. ",
        "Q8. I would imagine that most people could learn to use this tool very quickly. ",
        "Q9. I feel confident using this tool. ",
        "Q10. The interface of this tool is unnecessarily complex. (reverse-scored)",
        "Q11. I need to learn a lot before I can get going with this tool. (reverse-scored)",
    ], "status": "auto"},
    "communication_items": {"columns": [
        "Q12. This tool supports clear and timely communication within my team. ",
        "Q13. Communication through this tool is evenly distributed among team members, rather than concentrated among a few individuals. ",
    ], "status": "auto"},
    "coordination_items": {"columns": [
        "Q14. This tool helps my team coordinate tasks and track progress effectively. ",
        "Q15. This tool makes it easy to find past discussions or shared knowledge when needed. ",
    ], "status": "auto"},
    "performance_items": {"columns": [
        "Q16. My team's overall productivity is positively supported by this tool. ",
        "Q17. This tool helps my team achieve its goals, regardless of members' technical background. ",
    ], "status": "auto"},
    "reverse_scored_items": [
        "Q10. The interface of this tool is unnecessarily complex. (reverse-scored)",
        "Q11. I need to learn a lot before I can get going with this tool. (reverse-scored)",
    ],
    "unmapped_likert_columns": [],
}
