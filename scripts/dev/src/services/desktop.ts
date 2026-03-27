import { spawn } from "node:child_process";
import { closeSync, existsSync, openSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

import {
  createNodeOptions,
  ensureParentDirectory,
  readDevLock,
  removeDevLock,
  repoRootPath,
  terminateProcess,
  waitForProcessStart,
  writeDevLock,
} from "@nexu/dev-utils";
import { ensure } from "@nexu/shared";

import { createDesktopInjectedEnv } from "../shared/dev-runtime-config.js";
import { type DevLogTail, readLogTailFromFile } from "../shared/logs.js";
import {
  desktopDevLockPath,
  desktopWorkingDirectoryPath,
  getDesktopDevLogPath,
  getDesktopRuntimeRootPath,
} from "../shared/paths.js";

const require = createRequire(import.meta.url);

export type DesktopDevSnapshot = {
  service: "desktop";
  status: "running" | "stopped" | "stale";
  pid?: number;
  launchId?: string;
  runId?: string;
  sessionId?: string;
  logFilePath?: string;
};

function isPidRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function resolveElectronExecutablePath(): string {
  const electronEntryPath = require.resolve("electron", {
    paths: [desktopWorkingDirectoryPath, repoRootPath],
  });
  const electronExecutablePath = require(electronEntryPath) as string;

  ensure(
    typeof electronExecutablePath === "string" &&
      electronExecutablePath.length > 0,
  ).orThrow(() => new Error("unable to resolve electron executable path"));

  return electronExecutablePath;
}

function hasDesktopBuildArtifacts(): boolean {
  return [
    join(desktopWorkingDirectoryPath, "dist", "index.html"),
    join(desktopWorkingDirectoryPath, "dist-electron", "main", "bootstrap.js"),
  ].every((filePath) => existsSync(filePath));
}

async function runDesktopBuild(logFilePath: string): Promise<void> {
  const stdoutFd = openSync(logFilePath, "a");

  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      process.platform === "win32" ? "pnpm.cmd" : "pnpm",
      ["--dir", desktopWorkingDirectoryPath, "build"],
      {
        cwd: repoRootPath,
        env: {
          ...process.env,
          NODE_OPTIONS: createNodeOptions(),
        },
        stdio: ["ignore", stdoutFd, stdoutFd],
        windowsHide: true,
      },
    );

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`desktop build failed (exit ${String(code ?? 1)})`));
    });
  }).finally(() => {
    closeSync(stdoutFd);
  });
}

function createDesktopLaunchEnv(launchId: string): NodeJS.ProcessEnv {
  return {
    ...process.env,
    NODE_OPTIONS: createNodeOptions(),
    ...createDesktopInjectedEnv(),
    NEXU_WORKSPACE_ROOT: repoRootPath,
    NEXU_DESKTOP_APP_ROOT: desktopWorkingDirectoryPath,
    NEXU_DESKTOP_RUNTIME_ROOT: getDesktopRuntimeRootPath(),
    NEXU_DESKTOP_BUILD_SOURCE:
      process.env.NEXU_DESKTOP_BUILD_SOURCE ?? "local-dev",
    NEXU_DESKTOP_BUILD_BRANCH:
      process.env.NEXU_DESKTOP_BUILD_BRANCH ?? "unknown",
    NEXU_DESKTOP_BUILD_COMMIT:
      process.env.NEXU_DESKTOP_BUILD_COMMIT ?? "unknown",
    NEXU_DESKTOP_BUILD_TIME:
      process.env.NEXU_DESKTOP_BUILD_TIME ?? new Date().toISOString(),
    NEXU_DESKTOP_LAUNCH_ID: launchId,
  };
}

async function launchDesktopProcess(options: {
  launchId: string;
  logFilePath: string;
}): Promise<number> {
  const stdoutFd = openSync(options.logFilePath, "a");
  const child = spawn(
    resolveElectronExecutablePath(),
    [desktopWorkingDirectoryPath],
    {
      cwd: repoRootPath,
      env: createDesktopLaunchEnv(options.launchId),
      detached: true,
      stdio: ["ignore", stdoutFd, stdoutFd],
      windowsHide: true,
    },
  );

  try {
    await waitForProcessStart(child, "desktop dev process");
  } finally {
    child.unref();
    closeSync(stdoutFd);
  }

  ensure(Boolean(child.pid)).orThrow(
    () => new Error("desktop dev process did not expose an electron pid"),
  );

  return child.pid as number;
}

export async function startDesktopDevProcess(options: {
  sessionId: string;
}): Promise<DesktopDevSnapshot> {
  const existingSnapshot = await getCurrentDesktopDevSnapshot();

  ensure(existingSnapshot.status !== "running").orThrow(
    () =>
      new Error(
        "desktop dev process is already running; run `pnpm dev stop desktop` first",
      ),
  );

  const runId = options.sessionId;
  const sessionId = options.sessionId;
  const launchId = `desktop-launch-${Date.now()}`;
  const logFilePath = getDesktopDevLogPath(runId);

  await ensureParentDirectory(logFilePath);

  if (!hasDesktopBuildArtifacts()) {
    await runDesktopBuild(logFilePath);
  }

  const pid = await launchDesktopProcess({ launchId, logFilePath });

  await writeDevLock(desktopDevLockPath, {
    pid,
    runId,
    sessionId,
    launchId,
  });

  return {
    service: "desktop",
    status: "running",
    pid,
    launchId,
    runId,
    sessionId,
    logFilePath,
  };
}

export async function stopDesktopDevProcess(): Promise<DesktopDevSnapshot> {
  const snapshot = await getCurrentDesktopDevSnapshot();

  ensure(snapshot.status === "running" && Boolean(snapshot.pid)).orThrow(
    () => new Error("desktop dev process is not running"),
  );

  await terminateProcess(snapshot.pid as number);
  await removeDevLock(desktopDevLockPath);

  return snapshot;
}

export async function restartDesktopDevProcess(options: {
  sessionId: string;
}): Promise<DesktopDevSnapshot> {
  const snapshot = await getCurrentDesktopDevSnapshot();

  if (snapshot.status === "running") {
    await stopDesktopDevProcess();
  }

  return startDesktopDevProcess(options);
}

export async function getCurrentDesktopDevSnapshot(): Promise<DesktopDevSnapshot> {
  try {
    const lock = await readDevLock(desktopDevLockPath);
    const logFilePath = getDesktopDevLogPath(lock.runId);

    if (!isPidRunning(lock.pid)) {
      return {
        service: "desktop",
        status: "stale",
        pid: lock.pid,
        launchId: lock.launchId,
        runId: lock.runId,
        sessionId: lock.sessionId,
        logFilePath,
      };
    }

    return {
      service: "desktop",
      status: "running",
      pid: lock.pid,
      launchId: lock.launchId,
      runId: lock.runId,
      sessionId: lock.sessionId,
      logFilePath,
    };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return {
        service: "desktop",
        status: "stopped",
      };
    }

    throw error;
  }
}

export async function readDesktopDevLog(): Promise<DevLogTail> {
  const snapshot = await getCurrentDesktopDevSnapshot();

  ensure(Boolean(snapshot.logFilePath)).orThrow(
    () => new Error("desktop dev log is unavailable"),
  );

  return readLogTailFromFile(snapshot.logFilePath as string);
}
