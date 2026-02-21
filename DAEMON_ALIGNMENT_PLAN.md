# PTY Daemon Alignment Plan (v1 Breaking)

## Scope and Decision

- Keep protocol name as `v1` and apply breaking changes directly.
- Prioritize: recovery reliability, multi-client model, flow-control consistency, and observability.
- Preserve Rust daemon event-loop and performance strengths while aligning higher-level behavior with Superset best practices.

## Success Criteria

- Recovery success (recoverable sessions): 100%.
- Recovery success (all sessions): >= 99%, with explicit machine-readable failure codes for the rest.
- No protocol/type drift between Rust daemon, TS client, tests, and docs.
- No regressions in high-throughput and slow-subscriber scenarios.

## Workstreams

### W1. Protocol hard-cut in v1

- Why: remove compatibility burden, clean up protocol debt, unblock faster iteration.
- Superset does: introduces protocol versions in hello and enforces strict handshake contract.
- We will do:
  - Update `crates/daemon/src/protocol/message.rs` handshake with required `client_id` and `role` (`control|stream`).
  - Standardize response/error payloads and session-state fields for attach/create flows.
  - Update `packages/pty-daemon/src/client.ts` parsing and strong typing to new contract only.
- Deliverables:
  - Updated request/response types in Rust and TS.
  - Explicit breaking error code for old clients.

### W2. Recovery pipeline (journal + reconcile + cold restore)

- Why: largest user-visible reliability gap.
- Superset does: daemon manager + history manager + startup reconciliation.
- We will do:
  - Add a persistent session journal module (single source of truth).
  - Reconcile sessions at daemon boot (`alive`, `zombie`, `unrecoverable`).
  - Implement cold-restore policy for sessions that can be safely recreated.
  - Return deterministic recovery failure codes.
- Deliverables:
  - New journal/reconcile path in daemon startup.
  - Recovery APIs/events integrated into v1 protocol.

### W3. Multi-client model (owner + observers)

- Why: current single-subscriber model blocks collaborative and multi-view workflows.
- Superset does: separates control vs stream sockets by client identity.
- We will do:
  - One owner per session (write/signal/kill/resize permissions).
  - Multiple observers (read-only output/exit/error events).
  - Optional `takeover` action for owner handoff.
- Deliverables:
  - Session subscriber model refactor in `crates/daemon/src/session/manager.rs`.
  - Role checks in request handling.

### W4. Session lifecycle state machine hardening

- Why: race-prone paths are kill/attach/write overlaps.
- Superset does: explicit terminating behavior and force cleanup timeout.
- We will do:
  - Introduce explicit states: `Starting -> Running -> Terminating -> Exited -> Finalized`.
  - Block mutating ops during `Terminating`.
  - Add timeout escalation to forced kill and idempotent finalize.
- Deliverables:
  - State transitions with invariant checks.
  - Deterministic kill convergence behavior.

### W5. Flow-control and event semantics convergence

- Why: current `backpressure_warning` semantics are not fully aligned across implementation/docs.
- Superset does: practical stream backpressure controls around drain and queue caps.
- We will do:
  - Keep `backpressure_warning` only if emitted by server on level transitions.
  - Enforce three-layer limits: per-session, per-client, socket write queue.
  - Define and document exact emission policy.
- Deliverables:
  - Unified behavior across Rust daemon, TS client, tests, docs.

### W6. Error-code taxonomy and observability

- Why: required for operational confidence and recovery SLO auditing.
- Superset does: clearer top-level failure pathways and daemon-level diagnostics.
- We will do:
  - Standardize error codes (`SESSION_GONE`, `CWD_MISSING`, `SHELL_NOT_FOUND`, `PERMISSION_DENIED`, `ROLE_FORBIDDEN`, `PROTO_BREAKING_CHANGE`, etc.).
  - Add structured logs and metrics for queue depth, attach latency, recovery outcomes, and drop counts.
- Deliverables:
  - Error code registry + emitted metrics.

### W7. Test matrix and release gates

- Why: breaking changes must be guarded by contract and race tests.
- Superset does: multi-layer tests around manager/session/daemon behavior.
- We will do:
  - Contract tests (protocol serialization, handshake, role enforcement).
  - Concurrency tests (kill/attach/write races).
  - Recovery tests (restart, crash, orphan cleanup).
  - Throughput/slow-subscriber performance tests.
- Deliverables:
  - CI gates for functional + performance regressions.

## Execution Order

1. W1 Protocol hard-cut in v1.
2. W2 Recovery pipeline.
3. W3 Multi-client model.
4. W4 Lifecycle state machine hardening.
5. W5 Flow-control convergence.
6. W6 Observability.
7. W7 Test matrix + release gates.

## Milestones

- M1: Protocol and client compile with new v1 contract.
- M2: Recovery reconcile path enabled and tested.
- M3: Multi-client owner/observer model enabled.
- M4: Lifecycle race tests stable.
- M5: Performance and reliability gates green.

## Risks and Mitigations

- Risk: protocol cut causes client lockouts.
  - Mitigation: explicit `PROTO_BREAKING_CHANGE` and migration notes in package README.
- Risk: recovery false positives produce inconsistent state.
  - Mitigation: strict reconcile checks + conservative unrecoverable fallback.
- Risk: multi-client fanout increases memory pressure.
  - Mitigation: bounded queues + per-client limits + explicit drop counters.
