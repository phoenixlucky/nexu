import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
} from "node:fs";
import { dirname, resolve } from "node:path";

const WINDOWS_CONFIG_REGKEY = "HKCU\\Software\\Nexu\\Desktop";
const USER_DATA_ROOT_VALUE = "UserDataRoot";
const PENDING_SOURCE_VALUE = "PendingUserDataMigrationSource";
const PENDING_TARGET_VALUE = "PendingUserDataMigrationTarget";
const PENDING_STRATEGY_VALUE = "PendingUserDataMigrationStrategy";

type WindowsUserDataMigrationStrategy = "move" | "copy" | "noop";

interface PendingWindowsUserDataMigration {
  sourceDir: string;
  targetDir: string;
  strategy: WindowsUserDataMigrationStrategy;
}

interface ExecuteWindowsUserDataMigrationOpts {
  currentUserDataDir: string;
  log: (message: string) => void;
}

function readRegistryValues(): Record<string, string> {
  try {
    const output = execFileSync("reg.exe", ["query", WINDOWS_CONFIG_REGKEY], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true,
    });

    const values: Record<string, string> = {};
    for (const line of output.split(/\r?\n/u)) {
      const match = line.match(/^\s*([^\s]+)\s+REG_\w+\s+(.+)$/u);
      if (match?.[1] && match[2]) {
        values[match[1].trim()] = match[2].trim();
      }
    }
    return values;
  } catch {
    return {};
  }
}

function deleteRegistryValue(name: string): void {
  try {
    execFileSync(
      "reg.exe",
      ["delete", WINDOWS_CONFIG_REGKEY, "/v", name, "/f"],
      {
        stdio: ["ignore", "ignore", "ignore"],
        windowsHide: true,
      },
    );
  } catch {}
}

function clearPendingMigrationRegistryValues(): void {
  deleteRegistryValue(PENDING_SOURCE_VALUE);
  deleteRegistryValue(PENDING_TARGET_VALUE);
  deleteRegistryValue(PENDING_STRATEGY_VALUE);
}

function readPendingMigration(): PendingWindowsUserDataMigration | null {
  const values = readRegistryValues();
  const sourceDir = values[PENDING_SOURCE_VALUE];
  const targetDir = values[PENDING_TARGET_VALUE];
  const strategyValue = values[PENDING_STRATEGY_VALUE];

  if (!sourceDir || !targetDir || !strategyValue) {
    return null;
  }

  if (
    strategyValue !== "move" &&
    strategyValue !== "copy" &&
    strategyValue !== "noop"
  ) {
    return null;
  }

  return {
    sourceDir: resolve(sourceDir),
    targetDir: resolve(targetDir),
    strategy: strategyValue,
  };
}

function isDirectoryEmpty(path: string): boolean {
  if (!existsSync(path)) {
    return true;
  }

  try {
    return readdirSync(path).length === 0;
  } catch {
    return false;
  }
}

function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

function isNestedPath(parentPath: string, childPath: string): boolean {
  const normalizedParent = resolve(parentPath);
  const normalizedChild = resolve(childPath);
  return normalizedChild.startsWith(`${normalizedParent}\\`);
}

function copyMissingRecursive(sourceDir: string, targetDir: string): void {
  ensureDir(targetDir);

  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = resolve(sourceDir, entry.name);
    const targetPath = resolve(targetDir, entry.name);

    if (existsSync(targetPath)) {
      if (entry.isDirectory()) {
        copyMissingRecursive(sourcePath, targetPath);
      }
      continue;
    }

    cpSync(sourcePath, targetPath, { recursive: true });
  }
}

function executeMoveMigration(sourceDir: string, targetDir: string): string {
  ensureDir(dirname(targetDir));

  if (isDirectoryEmpty(targetDir)) {
    try {
      if (existsSync(targetDir)) {
        rmSync(targetDir, { recursive: true, force: true });
      }
      renameSync(sourceDir, targetDir);
      return "move strategy completed via rename";
    } catch {
      ensureDir(targetDir);
    }
  }

  copyMissingRecursive(sourceDir, targetDir);
  rmSync(sourceDir, { recursive: true, force: true });
  return "move strategy completed via copy fallback";
}

export function executePendingWindowsUserDataMigration(
  opts: ExecuteWindowsUserDataMigrationOpts,
): void {
  const pending = readPendingMigration();
  if (!pending) {
    return;
  }

  const { currentUserDataDir, log } = opts;
  const currentTargetDir = resolve(currentUserDataDir);

  try {
    if (pending.targetDir !== currentTargetDir) {
      log(
        `pending migration target mismatch current=${currentTargetDir} pending=${pending.targetDir}; clearing`,
      );
      clearPendingMigrationRegistryValues();
      return;
    }

    if (pending.strategy === "noop") {
      log("pending migration strategy=noop; clearing");
      clearPendingMigrationRegistryValues();
      return;
    }

    if (pending.sourceDir === pending.targetDir) {
      log("pending migration source equals target; clearing");
      clearPendingMigrationRegistryValues();
      return;
    }

    if (!existsSync(pending.sourceDir) || isDirectoryEmpty(pending.sourceDir)) {
      log(
        `pending migration source missing or empty: ${pending.sourceDir}; clearing`,
      );
      clearPendingMigrationRegistryValues();
      return;
    }

    if (
      isNestedPath(pending.sourceDir, pending.targetDir) ||
      isNestedPath(pending.targetDir, pending.sourceDir)
    ) {
      log(
        `pending migration skipped due to overlapping paths source=${pending.sourceDir} target=${pending.targetDir}`,
      );
      clearPendingMigrationRegistryValues();
      return;
    }

    ensureDir(pending.targetDir);

    if (pending.strategy === "copy") {
      copyMissingRecursive(pending.sourceDir, pending.targetDir);
      log(
        `copy strategy completed source=${pending.sourceDir} target=${pending.targetDir}`,
      );
      clearPendingMigrationRegistryValues();
      return;
    }

    const result = executeMoveMigration(pending.sourceDir, pending.targetDir);
    log(`${result} source=${pending.sourceDir} target=${pending.targetDir}`);
    clearPendingMigrationRegistryValues();
  } catch (error) {
    log(
      `pending migration failed source=${pending.sourceDir} target=${pending.targetDir} strategy=${pending.strategy} error=${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function readWindowsRegistryUserDataRoot(): string | null {
  const values = readRegistryValues();
  const userDataRoot = values[USER_DATA_ROOT_VALUE];
  return userDataRoot ? resolve(userDataRoot) : null;
}
