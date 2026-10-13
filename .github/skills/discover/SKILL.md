---
name: discover
description: Discovery workflow: turn an idea, bug, or area of the codebase into a grilled spec and agent-ready GitHub issues.
disable-model-invocation: true
argument-hint: "Idea, bug report, or area to investigate"
---
Run the discovery workflow for: ${input:topic:What should we explore?}

1. **Preflight.** Read `docs/agents/issue-tracker.md` and `docs/agents/triage-labels.md`. If missing, stop and ask the user to run `/setup-matt-pocock-skills`. Note `GLOSSARY.md` and `docs/adr/` if they exist; use their vocabulary.

2. **Research (Sonnet).** Write 1–3 precise questions and send them to `researcher` in parallel. Always include: where the relevant behaviour lives today, whether the request is already implemented (search by domain concept, not wording), any prior rejection in `.out-of-scope/`, and existing test seams. Budget 300 words each.

3. **Grill (Opus).** Follow `.agents/skills/grilling/SKILL.md`: ask the user a few questions per round until every branch of the design is resolved. Skip questions the research already answered. If new terms or decisions land, note them for step 5.

4. **Draft (Opus).**
   - If the work fits one ticket, draft a single issue using the to-tickets issue template.
   - Otherwise draft a spec per `.agents/skills/to-spec/SKILL.md` and a tracer-bullet ticket breakdown per `.agents/skills/to-tickets/SKILL.md` (vertical slices, blocking edges, prefactors first).
   - Present the breakdown as a numbered list (title, blocked by, what it delivers). Iterate until the user approves. No file paths or code snippets in issue bodies.

5. **Publish (small model).** Send `chore` the final, fully written issues in dependency order (spec first, then blockers before dependents) with: exact titles, bodies, labels (`ready-for-agent` unless the user said otherwise), placeholders like `{{SPEC}}`/`{{T1}}` where bodies reference not-yet-created issues, and instructions from `docs/agents/issue-tracker.md` for parent/sub-issue and blocking links. Ask for issue numbers and URLs back. If glossary/ADR updates were agreed, include them as verbatim edits in the same brief.

6. **Report.** List the created issues with URLs and the ready frontier (tickets with no open blockers). Suggest `/implement` with the first frontier ticket.
