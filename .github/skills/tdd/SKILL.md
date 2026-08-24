---
name: tdd
description: Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions red-green-refactor, or wants integration tests.
---

# Test-Driven Development

TDD is the red-green-refactor loop. Use this skill to keep tests behavior-focused and incremental.

When exploring the codebase, read `CONTEXT.md` if it exists and respect ADRs in the area being changed. For this project, prefer public HTTP routes and user-visible frontend behavior as test seams.

## What a good test is

Tests verify behavior through public interfaces, not implementation details. A good test reads like a specification and survives internal refactors.

For this project, prioritize these seams:

- authentication: login, expired sessions, and authorization failures
- check-in: valid, expired, reused, and missing dynamic codes
- checkout: active session completion and no-active-session errors
- records and statistics: filtering, pagination, and role restrictions
- frontend flows: loading, empty, error, retry, and successful state transitions

## Test seams

A seam is the public interface where behavior can be observed without reaching into internals. Before writing tests, name the seam and the behavior under test. Test only confirmed, user-relevant seams.

Prefer integration-style tests through HTTP endpoints for the Express package. Avoid mocking database statements or asserting private helpers. For Vue, test rendered states and user actions through the component's public behavior.

## Anti-patterns

- implementation-coupled tests that mock private collaborators
- tautological assertions that recompute the result using the same algorithm
- horizontal slicing: writing a large test suite before implementing one behavior
- tests that query the database directly when an HTTP response is the actual contract

## Rules of the loop

1. Write one failing behavior test.
2. Implement only enough code to pass it.
3. Repeat for the next behavior.
4. Refactor only after the focused behavior checks pass.

Keep the test names in the project's domain language and do not add speculative features just to satisfy a test.
