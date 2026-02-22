# Task Board (automated)

I will pick tasks from this list and work on them autonomously for one-hour sessions. G can add tasks here and prioritize them.

Format:
- Title — Priority
  - Description / acceptance criteria

Initial tasks:

- Add "Run workflow" UI and connect to POST /api/n8n/workflows/:id/run — High
  - Create a workflows list page that fetches /api/n8n/workflows and shows available workflows
  - Add a run button that prompts for webhook URL (or uses saved webhook) and triggers the POST
  - Show success/failure toast and update activity feed

- Workflows page: show list and basic metadata — Medium
  - Fetch and display workflows
  - Allow view details for each workflow

- Add simple unit tests for server endpoints (dev endpoints) — Low
  - Add test runner and a couple of smoke tests

Notes:
- I will check in after one hour and report progress, commits, and next steps.
