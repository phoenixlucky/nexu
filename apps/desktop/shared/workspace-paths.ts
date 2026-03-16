import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Walk up from the current file until we find pnpm-workspace.yaml,
 * which marks the monorepo root. Falls back to the NEXU_WORKSPACE_ROOT
 * env var when set. This avoids hard-coding a relative depth that breaks
 * when Vite bundles the file into dist-electron/main/.
 */
export function getWorkspaceRoot(): string {
  if (process.env.NEXU_WORKSPACE_ROOT) {
    return process.env.NEXU_WORKSPACE_ROOT;
  }

  let dir = import.meta.dirname;
  for (let i = 0; i < 10; i++) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }

  // Absolute fallback — should not be reached in practice.
  return resolve(import.meta.dirname, "../../../..");
}

export function getDesktopAppRoot(): string {
  return (
    process.env.NEXU_DESKTOP_APP_ROOT ??
    resolve(getWorkspaceRoot(), "apps/desktop")
  );
}
