# Implementation Decisions

Decisions made during implementation that aren't in the original design doc.

---

## 2026-03-23

### Decision: Namespace changed to `io.nexu.*`

**Context**: Original design used `com.nexu.*` for launchd labels.

**Decision**: Use `io.nexu.*` instead.

**Rationale**: Better alignment with domain naming conventions (nexu.io domain).

**Labels**:
- Production: `io.nexu.controller`, `io.nexu.openclaw`
- Development: `io.nexu.controller.dev`, `io.nexu.openclaw.dev`

---

### Decision: Feature flag for gradual rollout

**Context**: Large refactor, need safe migration path.

**Decision**: Use `NEXU_USE_LAUNCHD=1` env var to enable launchd bootstrap.

**Rationale**: Allows testing launchd path without breaking existing flow. Can be enabled per-environment.

**Impact**: `isLaunchdBootstrapEnabled()` function checks this flag.

---

### Decision: Separate bootstrap module instead of inline changes

**Context**: index.ts is complex, inline changes risky.

**Decision**: Create `launchd-bootstrap.ts` as a separate module that can be called conditionally.

**Rationale**:
- Keeps existing code path intact
- Easier to test and debug
- Can switch between paths at runtime

**Impact**: New module at `apps/desktop/main/services/launchd-bootstrap.ts`.

---

## Template

### Decision: [Title]

**Context**: [What problem or question arose]

**Decision**: [What we decided]

**Rationale**: [Why]

**Impact**: [What code/config changes result]
