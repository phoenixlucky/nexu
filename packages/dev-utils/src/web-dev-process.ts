import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";

import { ensure } from "@nexu/shared";

import {
  createRunId,
  ensureDirectory,
  ensureParentDirectory,
  getWebDevLogPath,
  repoRootPath,
  resolveTsxPaths,
  webSupervisorPath,
} from "./paths.js";
import { spawnHiddenProcess } from "./spawn-hidden-process.js";
import {
  readWebDevLock,
  removeWebDevLock,
  writeWebDevLock,
} from "./web-dev-lock.js";

export type WebDevSnapshot = {
  service: "web";
  status: "running" | "stopped" | "stale";
  pid?: number;
  listenerPid?: number;
  runId?: string;
  logFilePath?: string;
};

function createWebCommand(): { command: string; args: string[] } {
  const { cliPath } = resolveTsxPaths();

  return {
    command: process.execPath,
    args: [cliPath, webSupervisorPath],
  };
}

function createNodeOptions(): string {
  const existing = process.env.NODE_OPTIONS?.trim();

  if (existing) {
    return `${existing} --conditions=development`;
  }

  return "--conditions=development";
}

async function terminateProcess(pid: number): Promise<void> {
  if (process.platform === "win32") {
    await new Promise<void>((resolve, reject) => {
      const child = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });

      child.once("error", reject);
      child.once("exit", (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(new Error(`taskkill exited with code ${code ?? 1}`));
      });
    });

    return;
  }

  try {
    process.kill(-pid, "SIGTERM");
    return;
  } catch {
    process.kill(pid, "SIGTERM");
  }
}

async function getWebPortPid(): Promise<number> {
  const output = await new Promise<string>((resolve, reject) => {
    const child = spawn("netstat", ["-ano"], {
      stdio: ["ignore", "pipe", "inherit"],
    });

    let stdout = "";

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }

      reject(new Error(`netstat exited with code ${code ?? 1}`));
    });
  });

  const lines = output.split(/\r?\n/);

  for (const line of lines) {
    if (!line.includes(":5173") || !line.includes("LISTENING")) {
      continue;
    }

    const columns = line.trim().split(/\s+/);
    const pidText = columns.at(-1);

    if (!pidText) {
      continue;
    }

    const pid = Number(pidText);

    if (Number.isNaN(pid)) {
      continue;
    }

    return pid;
  }

  throw new Error("web dev server did not open port 5173");
}

async function waitForWebPortPid(): Promise<number> {
  for (let index = 0; index < 20; index += 1) {
    try {
      return await getWebPortPid();
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw new Error("web dev server did not open port 5173");
}

async function waitForProcessStart(
  child: ReturnType<typeof spawn>,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, 1000);

    function cleanup(): void {
      clearTimeout(timer);
      child.removeListener("error", onError);
      child.removeListener("exit", onExit);
    }

    function onError(error: Error): void {
      cleanup();
      reject(error);
    }

    function onExit(code: number | null, signal: NodeJS.Signals | null): void {
      cleanup();
      reject(
        new Error(
          `web dev process exited early (code: ${code ?? "none"}, signal: ${signal ?? "none"})`,
        ),
      );
    }

    child.once("error", onError);
    child.once("exit", onExit);
  });
}

export async function startWebDevProcess(): Promise<WebDevSnapshot> {
  try {
    const existingSnapshot = await getCurrentWebDevSnapshot();

    ensure(existingSnapshot.status !== "running").orThrow(
      () =>
        new Error(
          "web dev process is already running; run `pnpm dev stop` first",
        ),
    );
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("code" in error) ||
      error.code !== "ENOENT"
    ) {
      throw error;
    }
  }

  const runId = createRunId();
  const logFilePath = getWebDevLogPath(runId);
  const commandSpec = createWebCommand();

  await ensureParentDirectory(logFilePath);
  await ensureDirectory(repoRootPath);

  const processHandle = await spawnHiddenProcess({
    command: commandSpec.command,
    args: commandSpec.args,
    cwd: repoRootPath,
    env: {
      ...process.env,
      NODE_OPTIONS: createNodeOptions(),
      NEXU_DEV_WEB_RUN_ID: runId,
    },
    logFilePath,
  });

  try {
    if (processHandle.child) {
      await waitForProcessStart(processHandle.child);
    }
  } finally {
    processHandle.dispose();
  }

  const listenerPid = await waitForWebPortPid();

  await writeWebDevLock({
    pid: processHandle.pid,
    runId,
  });

  return {
    service: "web",
    status: "running",
    pid: processHandle.pid,
    listenerPid,
    runId,
    logFilePath,
  };
}

export async function stopWebDevProcess(): Promise<WebDevSnapshot> {
  const snapshot = await getCurrentWebDevSnapshot();

  ensure(snapshot.status === "running" && Boolean(snapshot.pid)).orThrow(
    () => new Error("web dev process is not running"),
  );
  const supervisorPid = snapshot.pid as number;

  await terminateProcess(supervisorPid);

  try {
    const listenerPid = await getWebPortPid();
    await terminateProcess(listenerPid);
  } catch {}

  await removeWebDevLock();

  return snapshot;
}

export async function restartWebDevProcess(): Promise<WebDevSnapshot> {
  try {
    const snapshot = await getCurrentWebDevSnapshot();

    if (snapshot.status === "running") {
      await stopWebDevProcess();
    }
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("code" in error) ||
      error.code !== "ENOENT"
    ) {
      throw error;
    }
  }

  return startWebDevProcess();
}

export async function getCurrentWebDevSnapshot(): Promise<WebDevSnapshot> {
  try {
    const lock = await readWebDevLock();
    const logFilePath = getWebDevLogPath(lock.runId);

    try {
      process.kill(lock.pid, 0);
    } catch {
      return {
        service: "web",
        status: "stale",
        pid: lock.pid,
        runId: lock.runId,
        logFilePath,
      };
    }

    let listenerPid: number | undefined;

    try {
      listenerPid = await getWebPortPid();
    } catch {}

    return {
      service: "web",
      status: "running",
      pid: lock.pid,
      listenerPid,
      runId: lock.runId,
      logFilePath,
    };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return {
        service: "web",
        status: "stopped",
      };
    }

    throw error;
  }
}

export async function readWebDevLog(): Promise<string> {
  const snapshot = await getCurrentWebDevSnapshot();

  ensure(Boolean(snapshot.logFilePath)).orThrow(
    () => new Error("web dev log is unavailable"),
  );
  const logFilePath = snapshot.logFilePath as string;

  return readFile(logFilePath, "utf8");
}
