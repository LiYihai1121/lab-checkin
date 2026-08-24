---
name: focused-coding-workflow
description: "Use when implementing, debugging, or reviewing code changes in a VS Code workspace. Guides evidence-first local investigation, minimal edits, focused validation, iterative repair, and concise reporting."
argument-hint: "Describe the requested code change, failing behavior, or review target."
user-invocable: true
---

# Focused Coding Workflow

Use this skill to turn a coding request into a small, verifiable change without losing momentum or widening scope unnecessarily.

## 1. Establish the Local Anchor

1. Identify the most concrete starting point: a named file, symbol, failing command, test, error, or nearby implementation.
2. Read only the owning code path and one nearby test, call site, or analogous implementation.
3. State one falsifiable hypothesis about the behavior and one cheap check that could disconfirm it.
4. If the request is ambiguous, ask only the smallest question needed to choose the scope or expected behavior. Otherwise proceed.

If the starting point only forwards or registers behavior, follow one hop to the code that computes, mutates, or controls it.

## 2. Make the Smallest Useful Edit

1. Prefer existing abstractions, naming, tests, and project commands.
2. Keep the first edit reversible and limited to the controlling slice.
3. Preserve unrelated user changes and avoid opportunistic refactoring.
4. Add or update a focused test when the behavior is testable and coverage is missing.

Before editing, briefly tell the user what local behavior the edit targets.

## 3. Validate Immediately

After the first substantive edit, run the cheapest focused executable check available:

1. The failing or behavior-scoped test.
2. A narrow test for the touched module.
3. A focused compile, typecheck, or lint command.
4. Use `git diff` only when no executable check is available.

Do not broaden exploration or patch another slice before this check, unless a concrete blocker requires it.

## 4. Interpret and Iterate

- If validation succeeds, make only adjacent follow-up edits required by the request and rerun focused validation.
- If it fails but supports the hypothesis, repair the same slice and rerun the same check.
- If it falsifies the hypothesis, make one nearby hop to the code that more directly controls the behavior, then reassess.
- If it is ambiguous, inspect one nearby boundary, test, or call site before choosing repair versus a one-hop investigation.
- Stop after three repair attempts in the same file and report the blocker clearly.

## Completion Checklist

- The requested behavior is implemented at its controlling code path.
- The diff is limited to relevant files and preserves unrelated changes.
- A focused executable validation has passed, or its unavailability is documented.
- New diagnostics in touched files have been checked.
- The final report states the files changed, validation performed, and any remaining risk or test gap.

## Communication

Give short progress updates during exploration and after validation. For reviews, lead with concrete findings ordered by severity and file location; put summary and residual risk afterward. Use workspace-relative file links in the final report.
