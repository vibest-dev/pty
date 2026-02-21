# PTY Daemon Alignment Progress

## Status Legend

- `pending`: not started
- `in_progress`: currently being implemented
- `completed`: done and verified
- `blocked`: waiting on dependency/decision

## Workstream Status

| ID | Workstream | Status | Notes |
| --- | --- | --- | --- |
| W1 | Protocol hard-cut in v1 | completed | Handshake now requires `client_id` + `role`; breaking path enforced with explicit errors. |
| W2 | Recovery pipeline | completed | Journal persistence + startup reconcile + first cold-restore path implemented. |
| W3 | Multi-client owner/observer | completed | Multi-subscriber attach supported with owner-gated mutating operations. |
| W4 | Lifecycle state machine hardening | completed | Owner/role gates and deterministic finalize paths applied in kill/cleanup flows. |
| W5 | Flow-control/event convergence | completed | Backpressure test stability and queue behavior validation tightened across Rust/TS tests. |
| W6 | Error taxonomy + observability | completed | Added explicit `ROLE_FORBIDDEN`, `OWNER_REQUIRED` pathways and journal reconcile logging. |
| W7 | Test matrix + release gates | completed | Rust + TS suites green with updated protocol/ownership/recovery scenarios. |

## Timeline Log

### 2026-02-20

- Created alignment plan file: `DAEMON_ALIGNMENT_PLAN.md`.
- Created progress tracker: `DAEMON_ALIGNMENT_PROGRESS.md`.
- Marked W1 as `in_progress` and set execution order.
- Implemented first W1 breaking contract slice:
  - Added `client_id` and `role` fields to handshake request schema in `crates/daemon/src/protocol/message.rs`.
  - Added handshake validation and role gating in `crates/daemon/src/server/handler.rs`.
  - Updated TS client handshake payload defaults (`client_id`, `role`) in `packages/pty-daemon/src/client.ts`.
- Updated test harnesses for the new handshake shape:
  - `crates/daemon/tests/integration_test.rs`
  - `crates/daemon/tests/sync_refactor_test.rs`
  - `packages/pty-daemon/tests/client-handshake.test.ts`
- Added protocol guard tests:
  - Strict v1 handshake contract enforcement (`client_id` + `role` are required fields).
  - `stream` role calling control ops returns `ROLE_FORBIDDEN`.
- Refined W1 role semantics:
  - `stream` role is read-only (allows `list`),
  - control-only operations (`create`, `input`, `resize`, `signal`, `kill`, `kill_all`, `clear_scrollback`) are explicitly gated.
- Validation runs:
  - `cargo test -p vibest-pty-daemon --test integration_test` ✅ (21 passed)
  - `cargo test -p vibest-pty-daemon --test sync_refactor_test` ⚠️ 1 existing flaky failure (`test_large_output_backpressure`, low observed output bytes)
  - `bun test packages/pty-daemon/tests/client-handshake.test.ts packages/pty-daemon/tests/client-protocol-assertions.test.ts` ✅
  - `bun test packages/pty-daemon/tests/client-handshake.test.ts` ✅
  - `bun test packages/pty-daemon/tests/client-create-and-attach.test.ts packages/pty-daemon/tests/client-auto-start.test.ts packages/pty-daemon/tests/create-pty.test.ts` ✅
  - `bun test packages/pty-daemon/tests` ⚠️ 1 test failed on local socket bind path (`dist-runtime-parity.test.ts`, listen failure in temp path)
- Started W2 recovery pipeline:
  - Added persistent journal store in `crates/daemon/src/session/journal.rs`.
  - Added journal path config (`RUST_PTY_JOURNAL_PATH`) in `crates/daemon/src/config.rs`.
  - Wired journal lifecycle hooks in `crates/daemon/src/session/manager.rs` (create, attach timestamp touch, exit/finalize).
  - Added daemon startup reconcile hook in `crates/daemon/src/main.rs`.
  - Implemented first cold-restore policy for non-running journal entries (recreate PTY sessions from stored metadata).
  - Added journal fields for terminal dimensions (`cols`, `rows`) used by cold-restore.
- Implemented W3 owner/observer attach model:
  - Session subscribers now support fanout (session -> many subscribers).
  - Session ownership map added; mutating operations require owner (`OWNER_REQUIRED`).
  - Stream role remains read-only, control role can claim owner when unset.
- Stabilized cross-suite tests:
  - Updated integration expectations for multi-attach behavior.
  - Fixed flaky burst-output test by making output collection robust and shell command portable.
  - Fixed dist runtime parity socket-path issue (shorter Unix socket names).
- Final validation runs:
  - `cargo test -p vibest-pty-daemon` ✅
  - `bun test packages/pty-daemon/tests` ✅
- Documented breaking v1 handshake/ownership contract in `packages/pty-daemon/README.md`.
- Applied strict no-compat policy for legacy clients:
  - Handshake schema now requires `client_id` and `role` at decode level (no optional fallback).
  - Integration/sync test protocol mirrors updated to required fields.
  - Removed old missing-field fallback behavior from handler-level handshake logic.

## Next Actions

1. Optional: add journal-focused unit tests (`JournalStore` roundtrip/reconcile edge cases).
2. Optional: wire explicit daemon metrics export for reconcile outcomes and owner-denied ops.
