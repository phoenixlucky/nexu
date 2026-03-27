import { type ChildProcess, spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { removeWebDevLock, writeWebDevLock } from "@nexu/dev-utils";

const require = createRequire(import.meta.url);
const repoRootPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
);
const webWorkingDirectory = join(repoRootPath, "apps", "web");
const runId = process.env.NEXU_DEV_WEB_RUN_ID;

if (!runId) {
  throw new Error("NEXU_DEV_WEB_RUN_ID is required");
}

const webRunId = runId;

function createNodeOptions(): string {
  const existing = process.env.NODE_OPTIONS?.trim();

  if (existing) {
    return `${existing} --conditions=development`;
  }

  return "--conditions=development";
}

function createWebWorkerCommand(): { command: string; args: string[] } {
  const vitePackageJsonPath = require.resolve("vite/package.json", {
    paths: [webWorkingDirectory],
  });
  const viteBinPath = join(dirname(vitePackageJsonPath), "bin", "vite.js");

  return {
    command: process.execPath,
    args: [viteBinPath, "--strictPort"],
  };
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

async function waitForWorkerExit(child: ChildProcess): Promise<void> {
  await new Promise<void>((resolve) => {
    child.once("exit", () => {
      resolve();
    });
  });
}

let workerChild: ChildProcess | null = null;

async function writeRunningLock(): Promise<void> {
  await writeWebDevLock({
    pid: process.pid,
    runId: webRunId,
  });
}

async function removeRunningLock(): Promise<void> {
  await removeWebDevLock();
}

async function startWorker(): Promise<void> {
  const commandSpec = createWebWorkerCommand();
  const child = spawn(commandSpec.command, commandSpec.args, {
    cwd: webWorkingDirectory,
    env: {
      ...process.env,
      NODE_OPTIONS: createNodeOptions(),
    },
    stdio: "inherit",
    windowsHide: true,
  });

  if (!child.pid) {
    throw new Error("web worker did not expose a pid");
  }

  workerChild = child;

  child.once("exit", () => {
    workerChild = null;
  });
}

process.on("SIGINT", async () => {
  if (workerChild?.pid) {
    await terminateProcess(workerChild.pid);
    await waitForWorkerExit(workerChild);
  }

  await removeRunningLock();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  if (workerChild?.pid) {
    await terminateProcess(workerChild.pid);
    await waitForWorkerExit(workerChild);
  }

  await removeRunningLock();
  process.exit(0);
});

await writeRunningLock();
await startWorker();
