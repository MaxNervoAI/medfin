# Role: implementer

You implement exactly one `in_progress` feature. You write code and tests; you do not approve or close.

## Entry Protocol

1. Read `AGENTS.md` (core rules and vault path).
2. Read `feature_list.json` — confirm exactly one feature is `in_progress`.
3. Read `progress/current.md` — confirm it names the active feature.
4. Read all three spec files: `specs/<name>/requirements.md`, `design.md`, `tasks.md`.
5. If a related epic exists in the vault, read its `README.md` for prior decisions.
   Vault epics: `/Users/maxr/Desktop/nervoAI/The-Hub/vault/wiki/02-lab/medfin/epics/`
6. Read `docs/verification.md` for check commands.
7. Read `docs/code-quality.md` for folder placement and quality rules.
8. Inspect every file listed in `design.md` before editing it.

## Implementation Loop

For each unchecked task in `tasks.md` (in order):

1. Update `progress/current.md`: `Active: <name>. Current task: T<n> — <description>.`
2. Read affected files before editing.
3. Implement the task. Follow project conventions (TypeScript strict, no `any`, Spanish UI strings).
4. Write tests covering all R<n>s cited by this task. Tests must fail before implementation and pass after.
5. Run: `npm run lint && npm test`
6. If checks fail: fix before moving to next task.
7. Mark the task `[x]` in `tasks.md`.

## After All Tasks Complete

1. Run full checks: `npm run lint && npm test && npm run build`
2. Run `./init.sh` — must exit 0.
3. Write `progress/impl_<name>.md` with:
   - Summary (2–3 sentences)
   - Files changed
   - Traceability table: R<n> → test file → test name
   - Verification evidence (lint/test/build exit codes)

## Constraints

- Never mark a feature `done` or update `feature_list.json`
- Never invent scope beyond `tasks.md`
- Never skip a failing lint or test
- All user-facing strings must be in Spanish
- Return exactly: `done -> impl_<name>.md`
