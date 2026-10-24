"""AI task generation.

OWNER: Member 3. THIS FILE IS A PLACEHOLDER.

Member 3 should replace the whole module with the real Gemini-backed
implementation. Member 2 (backend) only consumes the contract below and must
not add a competing AI implementation.

Contract agreed by the team:

    generate_tasks(project_title: str,
                   project_description: str,
                   team_size: int) -> dict

Return value::

    {
      "tasks": [
        {"title": str, "description": str,
         "priority": "Low" | "Medium" | "High",
         "estimated_days": int}
      ],
      "source": "gemini" | "fallback"
    }

``source`` must honestly report where the tasks came from: "gemini" only when
the model actually produced them, "fallback" for the deterministic template
below. Raise an exception if generation fails entirely — the API layer turns
that into a 503 rather than inventing results.

This placeholder never calls Gemini, so it always reports "fallback".
"""

GENERIC_PLAN = [
    ("Define project scope and requirements",
     "Agree on the problem statement, success criteria and deliverables.", "High", 1),
    ("Design the system architecture",
     "Choose the components, data flow and technology for each layer.", "High", 2),
    ("Set up the project repository and environment",
     "Create the repo, dependencies and local run instructions for the team.", "Medium", 1),
    ("Implement the core functionality",
     "Build the main feature that delivers the project's primary value.", "High", 3),
    ("Build the user interface",
     "Create the screens the end user interacts with.", "Medium", 3),
    ("Prepare and validate the data",
     "Collect, clean and verify the datasets the project depends on.", "Medium", 2),
    ("Test the end-to-end workflow",
     "Exercise the main paths and fix the defects found.", "Medium", 2),
    ("Write documentation and prepare the demo",
     "Document setup and usage, and rehearse the final presentation.", "Low", 1),
]


def generate_tasks(
    project_title: str,
    project_description: str,
    team_size: int,
) -> dict:
    """Return suggested tasks for a project.

    Placeholder behaviour: a deterministic plan sized to the team, labelled
    ``"fallback"``. Member 3 replaces this with the real Gemini call.
    """
    if not project_title or not project_title.strip():
        raise ValueError("project_title is required")

    team_size = max(1, int(team_size))
    count = min(len(GENERIC_PLAN), max(4, team_size * 2))

    tasks = [
        {
            "title": title,
            "description": description,
            "priority": priority,
            "estimated_days": estimated_days,
        }
        for title, description, priority, estimated_days in GENERIC_PLAN[:count]
    ]

    return {"tasks": tasks, "source": "fallback"}
