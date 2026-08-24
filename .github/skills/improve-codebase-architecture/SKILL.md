---
name: improve-codebase-architecture
description: Scan this codebase for deepening opportunities and propose focused refactors for the check-in, QR code, records, and statistics modules.
disable-model-invocation: true
---

# Improve Codebase Architecture

Use this skill only when explicitly requested to review or improve the architecture of the lab check-in system.

## Project vocabulary

Use these terms consistently: module, interface, depth, seam, adapter, leverage, and locality. Keep the domain language concrete: user, dynamic check-in code, active session, checkout, record, and statistics.

## Scope first

Read `README.md` and `AGENTS.md` before scanning. Inspect recent history with `git log --oneline` and start from the subsystem the user named. Do not perform a repository-wide refactor without identifying a concrete source of friction.

Prioritize the modules that control these behaviors:

- `server/src/routes/checkin.js`: dynamic-code validation, active session rules, checkout duration
- `server/src/routes/qrcode.js`: code lifecycle and expiry
- `server/src/routes/records.js` and `server/src/routes/stats.js`: query and reporting contracts
- `web/src/views/Checkin.vue` and `web/src/views/admin/QrCodeView.vue`: loading, retry, and state transitions

## Review questions

For each candidate, ask:

- Is the module shallow, with an interface nearly as complex as its implementation?
- Does understanding one behavior require bouncing between too many modules?
- Does a tightly coupled adapter leak details across its seam?
- Would deleting the proposed module concentrate complexity or only move it?
- Can the behavior be tested through a stable public interface?

## Output

Return at most three candidates. For each include:

- files and public interface involved
- concrete friction and user impact
- smallest deepening change
- locality, leverage, and testability benefits
- risks, migration cost, and recommendation strength: Strong, Worth exploring, or Speculative

Do not implement a refactor during the review. First ask which candidate the user wants to pursue. When implementation is requested, use the TDD skill and work in vertical slices.
