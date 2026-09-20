"""
interview_data.py
The dissertation includes ONE completed semi-structured interview
(participant P1), reported in Chapter 4.11-4.12 of the PDF. This is
qualitative content, not a statistic derived from the Excel dataset —
there is nothing to "calculate" here, so unlike every other module in
this engine, this data is a fixed reference record.

This is intentionally NOT treated as a generalisable survey result: it
is only ever shown when the currently-loaded file is the bundled
dissertation dataset, and every consumer of this data must display the
"single participant, not generalisable" caveat alongside it.
"""

INTERVIEW_DATA = {
    "available": True,
    "participant": {
        "label": "P1",
        "role": "Software Developer",
        "experience": "3+ years",
        "working_arrangement": "Hybrid",
        "tools_used": ["Microsoft Teams", "Slack", "Zoom"],
    },
    "planned_sample": "8-12 participants (per methodology)",
    "actual_sample": "1 participant completed",
    "themes": [
        {
            "title": "Tool fragmentation and information scatter",
            "summary": "Using several platforms makes it unclear where information resides.",
            "quotation": "using several tools can sometimes make it difficult to know where particular information has been shared",
            "related_rq": ["RQ1", "RQ5"],
        },
        {
            "title": "Notification and communication overload",
            "summary": "Speed is valued, but volume causes important messages to be missed.",
            "quotation": "there can also be too much communication... important messages can easily get buried",
            "related_rq": ["RQ4", "RQ5"],
        },
        {
            "title": "Integration as a coordination enabler",
            "summary": "Linking chat tools to systems like Jira supports tracking, but breaks down when systems are unsynchronised.",
            "quotation": "Integrations with tools such as Jira are particularly helpful... The main problem is when different people use different systems",
            "related_rq": ["RQ1", "RQ4"],
        },
        {
            "title": "Perceived technical/non-technical asymmetry",
            "summary": "P1 perceives technical colleagues adapting faster than some non-technical colleagues.",
            "quotation": "Developers usually become comfortable with technical channels... Some non-technical colleagues may prefer simpler communication",
            "related_rq": ["RQ3"],
        },
        {
            "title": "UX as a mediator of focus",
            "summary": "Ease of use is perceived as freeing time for core work.",
            "quotation": "less time is spent dealing with the communication system itself. This allows the team to focus more on development work",
            "related_rq": ["RQ2"],
        },
    ],
    "proposed_improvements": [
        "Tighter integration between collaboration and project management systems",
        "Improved notification prioritisation",
        "Automated summaries of meetings or conversations for absent colleagues",
    ],
    "caveat": (
        "This is qualitative evidence from a single interview participant. "
        "With a sample of one, no claim of thematic saturation or "
        "representativeness is made, and these findings are not "
        "statistically generalisable to the wider survey sample."
    ),
}

NOT_AVAILABLE = {
    "available": False,
    "reason": "Interview data is specific to the bundled dissertation dataset and is not available for uploaded datasets.",
}


def get_interview_data(is_dissertation_file: bool) -> dict:
    return INTERVIEW_DATA if is_dissertation_file else NOT_AVAILABLE
