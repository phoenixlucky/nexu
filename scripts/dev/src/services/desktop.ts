import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";

import {
  createNodeOptions,
  readDevLock,
  removeDevLock,
  writeDevLock,
} from "@nexu/dev-utils";
import { ensure } from "@nexu/shared";

import { createDesktopInjectedEnv } from "../shared/dev-runtime-config.js";
import {
  type DevLogTail,
  readDesktopSessionLogTailFromFile,
} from "../shared/logs.js";
import {
  desktopDevCliPath,
  desktopDevLockPath,
  getDesktopDevLogPath,
  getDesktopDevStatePath,
} from "../shared/paths.js";

type DesktopManagerState = {
  launchId?: string;
  electronPid?: number | null;
  startedAt?: string;
  runtimeRoot?: string;
  platform?: string;
};

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

async function readDesktopManagerState(): Promise<DesktopManagerState | null> {
  try {
    const content = await readFile(getDesktopDevStatePath(), "utf8");
    return JSON.parse(content) as DesktopManagerState;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function runDesktopDevCli(
  command: "start" | "stop" | "restart",
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [desktopDevCliPath, command], {
      env: {
        ...process.env,
        NODE_OPTIONS: createNodeOptions(),
        ...createDesktopInjectedEnv(),
      },
      stdio: "inherit",
      windowsHide: true,
    });

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `desktop dev command failed: ${command} (exit ${String(code ?? 1)})`,
        ),
      );
    });
  });
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

  await runDesktopDevCli("start");

  const state = await readDesktopManagerState();
  const pid = state?.electronPid;

  ensure(Boolean(pid)).orThrow(
    () => new Error("desktop dev process did not expose an electron pid"),
  );

  const runId = options.sessionId;
  const sessionId = options.sessionId;

  await writeDevLock(desktopDevLockPath, {
    pid: pid as number,
    runId,
    sessionId,
  });

  return {
    service: "desktop",
    status: "running",
    pid: pid as number,
    launchId: state?.launchId,
    runId,
    sessionId,
    logFilePath: getDesktopDevLogPath(),
  };
}

export async function stopDesktopDevProcess(): Promise<DesktopDevSnapshot> {
  const snapshot = await getCurrentDesktopDevSnapshot();

  ensure(snapshot.status === "running" && Boolean(snapshot.pid)).orThrow(
    () => new Error("desktop dev process is not running"),
  );

  await runDesktopDevCli("stop");
  await removeDevLock(desktopDevLockPath);

  return snapshot;
}

export async function restartDesktopDevProcess(options: {
  sessionId: string;
}): Promise<DesktopDevSnapshot> {
  await runDesktopDevCli("restart");

  const state = await readDesktopManagerState();
  const pid = state?.electronPid;

  ensure(Boolean(pid)).orThrow(
    () => new Error("desktop dev process did not expose an electron pid"),
  );

  const runId = options.sessionId;
  const sessionId = options.sessionId;

  await writeDevLock(desktopDevLockPath, {
    pid: pid as number,
    runId,
    sessionId,
  });

  return {
    service: "desktop",
    status: "running",
    pid: pid as number,
    launchId: state?.launchId,
    runId,
    sessionId,
    logFilePath: getDesktopDevLogPath(),
  };
}

export async function getCurrentDesktopDevSnapshot(): Promise<DesktopDevSnapshot> {
  const logFilePath = getDesktopDevLogPath();
  const state = await readDesktopManagerState();

  if (!state?.electronPid) {
    return {
      service: "desktop",
      status: "stopped",
    };
  }

  let lockRunId: string | undefined;
  let lockSessionId: string | undefined;

  try {
    const lock = await readDevLock(desktopDevLockPath);
    lockRunId = lock.runId;
    lockSessionId = lock.sessionId;
  } catch (error) {
    if (
      !(error instanceof Error && "code" in error && error.code === "ENOENT")
    ) {
      throw error;
    }
  }

  if (!isPidRunning(state.electronPid)) {
    return {
      service: "desktop",
      status: "stale",
      pid: state.electronPid,
      launchId: state.launchId,
      runId: lockRunId,
      sessionId: lockSessionId,
      logFilePath,
    };
  }

  return {
    service: "desktop",
    status: "running",
    pid: state.electronPid,
    launchId: state.launchId,
    runId: lockRunId,
    sessionId: lockSessionId,
    logFilePath,
  };
}

export async function readDesktopDevLog(): Promise<DevLogTail> {
  const snapshot = await getCurrentDesktopDevSnapshot();

  ensure(Boolean(snapshot.logFilePath) && Boolean(snapshot.launchId)).orThrow(
    () => new Error("desktop dev session log is unavailable"),
  );

  return readDesktopSessionLogTailFromFile({
    launchId: snapshot.launchId as string,
    logFilePath: snapshot.logFilePath as string,
  });
}
