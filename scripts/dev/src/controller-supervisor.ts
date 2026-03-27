import { type ChildProcess, spawn } from "node:child_process";
import chokidar from "chokidar";

import {
  controllerSourceDirectoryPath,
  controllerWorkingDirectoryPath,
  getControllerPortPid,
  removeControllerDevLock,
  resolveTsxPaths,
  writeControllerDevLock,
} from "@nexu/dev-utils";

const runId = process.env.NEXU_DEV_CONTROLLER_RUN_ID;
const logFilePath = process.env.NEXU_DEV_CONTROLLER_LOG_PATH;

if (!runId) {
  throw new Error("NEXU_DEV_CONTROLLER_RUN_ID is required");
}

if (!logFilePath) {
  throw new Error("NEXU_DEV_CONTROLLER_LOG_PATH is required");
}

const controllerRunId = runId;
function createNodeOptions(): string {
  const existing = process.env.NODE_OPTIONS?.trim();

  if (existing) {
    return `${existing} --conditions=development`;
  }

  return "--conditions=development";
}

function createControllerWorkerCommand(): { command: string; args: string[] } {
  const { loaderUrl, preflightPath } = resolveTsxPaths();

  return {
    command: process.execPath,
    args: ["--require", preflightPath, "--import", loaderUrl, "src/index.ts"],
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

async function waitForControllerPortRelease(): Promise<void> {
  for (let index = 0; index < 20; index += 1) {
    try {
      await getControllerPortPid();
      await new Promise((resolve) => setTimeout(resolve, 250));
    } catch {
      return;
    }
  }

  throw new Error("controller dev server did not release port 3010");
}

async function waitForControllerPortPid(): Promise<number> {
  for (let index = 0; index < 30; index += 1) {
    try {
      return await getControllerPortPid();
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  throw new Error("controller dev server did not open port 3010");
}

let workerChild: ChildProcess | null = null;

async function waitForWorkerExit(child: ChildProcess): Promise<void> {
  await new Promise<void>((resolve) => {
    child.once("exit", () => {
      resolve();
    });
  });
}

async function writeRunningLock(): Promise<void> {
  await writeControllerDevLock({
    pid: process.pid,
    runId: controllerRunId,
  });
}

async function removeRunningLock(): Promise<void> {
  await removeControllerDevLock();
}

async function startWorker(): Promise<void> {
  const commandSpec = createControllerWorkerCommand();
  const child = spawn(commandSpec.command, commandSpec.args, {
    cwd: controllerWorkingDirectoryPath,
    env: {
      ...process.env,
      NODE_OPTIONS: createNodeOptions(),
    },
    stdio: "inherit",
    windowsHide: true,
  });

  if (!child.pid) {
    throw new Error("controller worker did not expose a pid");
  }

  workerChild = child;
  await waitForControllerPortPid();

  child.once("exit", () => {
    workerChild = null;
  });
}

async function restartWorker(): Promise<void> {
  if (workerChild?.pid) {
    await terminateProcess(workerChild.pid);
    await waitForWorkerExit(workerChild);
    await waitForControllerPortRelease();
  }

  console.log("[scripts-dev] controller watcher restarting worker");
  await startWorker();
}

const watcher = chokidar.watch(controllerSourceDirectoryPath, {
  ignoreInitial: true,
});

watcher.on("all", async () => {
  try {
    await restartWorker();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
  }
});

process.on("SIGINT", async () => {
  await watcher.close();

  if (workerChild?.pid) {
    await terminateProcess(workerChild.pid);
    await waitForWorkerExit(workerChild);
  }

  await removeRunningLock();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await watcher.close();

  if (workerChild?.pid) {
    await terminateProcess(workerChild.pid);
    await waitForWorkerExit(workerChild);
  }

  await removeRunningLock();
  process.exit(0);
});

await writeRunningLock();
await startWorker();
