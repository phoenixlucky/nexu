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

## Template

### Decision: [Title]

**Context**: [What problem or question arose]

**Decision**: [What we decided]

**Rationale**: [Why]

**Impact**: [What code/config changes result]
