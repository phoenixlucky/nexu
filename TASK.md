# Local Dev Workflow Pivot

## Current Branch

- branch: `feat/local-dev-workflow-optimization`
- created from the current dirty state of the former platform-split branch

## Immediate Context

This branch is now reserved for local development workflow optimization.

Important reset note:

- the experimental local-dev refactor work from this session was intentionally reverted
- do not continue from the reverted `@nexu/scripts` / root-bin attempt
- do not continue from the reverted desktop dev-seam experiment either
- treat the next session as a clean redesign starting from the current baseline

What remains in the codebase right now:

- root local web dev is still the old `scripts/dev.mjs` flow
- root scripts are still the old `dev` / `dev:controller` / `dev:desktop` surface
- desktop dev is back to the previous `vite` script behavior
- web Vite config is back to the previous fixed proxy config

## New Goal

Design a cleaner local development workflow with these constraints:

1. `scripts/dev/` should be the dedicated home for the new local-dev control plane
2. do not do a broad `scripts/` workspace/package migration
3. keep the command surface small and intentional
4. prefer real command usage over temporary harness scripts for validation
5. favor logs + fast restart over heavy defensive recovery logic

## Agreed Direction For The Next Session

The next iteration should be built from scratch under `scripts/dev/`, not by reviving the reverted code.

High-level target:

- a focused local-dev CLI/package under `scripts/dev/`
- command surface centered on:
  - `pnpm dev:start`
  - `pnpm dev:restart`
  - `pnpm dev:stop`
  - `pnpm dev:logs <web|controller>`
- logs written to `.tmp/dev/logs/<run_id>/...`
- lightweight facts written under `.tmp/dev/facts/`
- validation performed through the real commands themselves

Guardrails:

- do not reintroduce a repo-wide `@nexu/scripts` workspace/package
- do not expand root-level app-specific aliases unless truly necessary
- do not overbuild defensive state machines; keep orchestration light
- before introducing desktop, first verify controller+web stability through the real command surface

## Suggested Restart Point

When the next session starts:

1. inspect current root `package.json`, `scripts/dev.mjs`, and `AGENTS.md`
2. design the minimal `scripts/dev/` package/layout
3. move only the local-dev flow into that area
4. keep desktop launcher concerns separate for now
5. validate via actual `pnpm dev:*` commands instead of ad hoc Node harnesses

---

# Previous Platform Split Task

## Goal

Continue the desktop platform split after merging `origin/main` into `feat/windows-distribution-smoke`.

The target direction is a stable platform capability model that makes macOS launchd and Windows packaged runtime differences explicit, then gradually moves toward a directory shape like:

- `platforms/mac/runtime/*`
- `platforms/win/runtime/*`
- `platforms/mac/build/*`
- `platforms/win/build/*`

Do not do a giant migration first. Keep using the current strategy:

1. expose real platform differences as atomic interfaces
2. make existing code consume those interfaces
3. only then move files / deepen directory restructuring

## Current Status

`origin/main` has already been merged into this branch and pushed.

Current merge baseline:

- branch: `feat/windows-distribution-smoke`
- merge commit: `2890ae1`

Recent platform refactor work is not yet summarized in a commit here, but the code now contains the first capability layers.

## Runtime Capability Atoms Already Introduced

Files under `apps/desktop/main/platforms/` now expose these runtime atoms:

- `runtime residency`
- `runtime roots`
- `archive flow`
- `sidecar materializer`
- `runtime executable resolver`
- `port strategy`
- `state migration policy`
- `shutdown coordinator`

Key files:

- `apps/desktop/main/platforms/types.ts`
- `apps/desktop/main/platforms/index.ts`
- `apps/desktop/main/platforms/shared/runtime-common.ts`
- `apps/desktop/main/platforms/shared/runtime-roots.ts`
- `apps/desktop/main/platforms/shared/archive-flow.ts`
- `apps/desktop/main/platforms/shared/sidecar-materializer.ts`
- `apps/desktop/main/platforms/shared/runtime-executables.ts`
- `apps/desktop/main/platforms/shared/port-strategy.ts`
- `apps/desktop/main/platforms/shared/state-migration-policy.ts`
- `apps/desktop/main/platforms/shared/shutdown-coordinator.ts`
- `apps/desktop/main/platforms/mac/capabilities.ts`
- `apps/desktop/main/platforms/mac/runtime.ts`
- `apps/desktop/main/platforms/win/capabilities.ts`
- `apps/desktop/main/platforms/win/runtime.ts`
- `apps/desktop/main/platforms/default/capabilities.ts`

Main runtime consumers already partially converted:

- `apps/desktop/main/index.ts`
- `apps/desktop/main/runtime/manifests.ts`
- `apps/desktop/main/services/launchd-bootstrap.ts`

## Build Capability Atoms Already Introduced

Files under `apps/desktop/scripts/platforms/` now expose these build atoms:

- `build context`
- `artifact layout`
- `platform build driver`
- `web build env`
- `sidecar release env`

Key files:

- `apps/desktop/scripts/platforms/shared/build-capabilities.mjs`
- `apps/desktop/scripts/platforms/win/build-capabilities.mjs`
- `apps/desktop/scripts/platforms/mac/build-capabilities.mjs`

Main build consumers already partially converted:

- `apps/desktop/scripts/dist-win.mjs`
- `apps/desktop/scripts/dist-mac.mjs`

## What Still Needs To Be Split

### Runtime Side

Still not fully isolated:

- `launchd service topology`
  - plist labels
  - runtime-ports metadata
  - attach / recover behavior
- `embedded web server policy`
- `runtime diagnostics policy`
- `startup health / recovery policy`

### Build Side

Still not fully isolated:

- `release / signing policy`
  - mac notarize / staple / unsigned
  - win sign/edit executable / dir-only / unsigned behavior
- `artifact verification policy`
  - mac app/dmg/zip verification
  - win installer/unpacked verification
- `update feed layout policy`
  - mac arch-scoped feed
  - win installer/update metadata layout
- `builder toolchain policy`
  - dmg builder bundle
  - shell / command wrapping differences

## Recommended Next PR Sequence

### PR-A: Release / Signing Policy

Next best step.

Extract:

- `releasePolicy`
- `signingPolicy`

Suggested files:

- `apps/desktop/scripts/platforms/mac/release-policy.mjs`
- `apps/desktop/scripts/platforms/win/release-policy.mjs`
- `apps/desktop/scripts/platforms/shared/release-types.mjs`

### PR-B: Artifact Verification Policy

Extract post-build verification into platform policies.

Suggested files:

- `apps/desktop/scripts/platforms/mac/artifact-verifier.mjs`
- `apps/desktop/scripts/platforms/win/artifact-verifier.mjs`

### PR-C: Launchd Service Topology

Extract launchd-specific runtime service topology.

Target concepts:

- `serviceTopology`
- `runtimeAttachmentPolicy`

### PR-D: Diagnostics / Health Policy

Extract:

- `startupHealthPolicy`
- `runtimeDiagnosticsPolicy`

### PR-E: Directory Consolidation

Only after the above are stable.

Move toward:

- `platforms/mac/runtime/*`
- `platforms/win/runtime/*`
- `platforms/mac/build/*`
- `platforms/win/build/*`

## Guardrails

- one PR = one capability seam
- do not combine interface extraction + behavior change + file migration in the same PR unless trivial
- prefer making old code call new interfaces before deleting old logic
- keep `index.ts`, `manifests.ts`, `dist-win.mjs`, `dist-mac.mjs` moving toward orchestration-only roles

## Required Checks

For runtime TypeScript changes:

```bash
pnpm --filter @nexu/desktop typecheck
```

For build script edits:

```bash
node --check "apps/desktop/scripts/dist-win.mjs"
node --check "apps/desktop/scripts/dist-mac.mjs"
```

If capability changes affect broader TS paths:

```bash
pnpm typecheck
```

## Working Principle For The Next Session

The model is considered good enough to continue splitting.

Do not restart from scratch.
Do not jump straight to large directory moves.

Continue from the current capability model and push the next seam through to real call sites.

Recommended immediate next action:

- start `PR-A: Release / Signing Policy`
