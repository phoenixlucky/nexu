import { type ChildProcess, spawn } from "node:child_process";
import { closeSync, openSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

type SpawnHiddenProcessArgs = {
  command: string;
  args: string[];
  cwd: string;
  env: NodeJS.ProcessEnv;
  logFilePath: string;
};

type HiddenProcessHandle = {
  pid: number;
  child?: ChildProcess;
  dispose: () => void;
};

function quoteForCmd(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

async function spawnWindowsHiddenProcess({
  command,
  args,
  cwd,
  env,
  logFilePath,
}: SpawnHiddenProcessArgs): Promise<HiddenProcessHandle> {
  const launcherDirectory = await mkdtemp(join(tmpdir(), "nexu-dev-"));
  const batchPath = join(launcherDirectory, "launcher.cmd");
  const launcherPath = join(launcherDirectory, "launcher.vbs");
  const commandText = [command, ...args].map(quoteForCmd).join(" ");
  const batchSource = [
    "@echo off",
    `cd /d ${quoteForCmd(cwd)}`,
    `${commandText} >> ${quoteForCmd(logFilePath)} 2>&1`,
  ].join("\r\n");
  const launcherSource = [
    'Set shell = CreateObject("WScript.Shell")',
    "shell.CurrentDirectory = WScript.Arguments(0)",
    'exitCode = shell.Run("launcher.cmd", 0, True)',
    "WScript.Quit exitCode",
  ].join("\r\n");

  await writeFile(batchPath, `${batchSource}\r\n`, "utf8");
  await writeFile(launcherPath, `${launcherSource}\r\n`, "utf8");

  const child = spawn(
    "wscript.exe",
    ["//nologo", launcherPath, launcherDirectory],
    {
      cwd,
      env,
      stdio: "ignore",
      windowsHide: true,
      detached: true,
    },
  );

  if (!child.pid) {
    await rm(launcherDirectory, { recursive: true, force: true });
    throw new Error("hidden process did not expose a pid");
  }

  child.once("exit", () => {
    void rm(launcherDirectory, { recursive: true, force: true });
  });

  return {
    pid: child.pid,
    child,
    dispose: () => {
      child.unref();
    },
  };
}

function spawnPosixHiddenProcess({
  command,
  args,
  cwd,
  env,
  logFilePath,
}: SpawnHiddenProcessArgs): HiddenProcessHandle {
  const logFd = openSync(logFilePath, "a");
  const child = spawn(command, args, {
    cwd,
    env,
    stdio: ["ignore", logFd, logFd],
    detached: true,
    windowsHide: true,
  });

  if (!child.pid) {
    closeSync(logFd);
    throw new Error("hidden process did not expose a pid");
  }

  return {
    pid: child.pid,
    child,
    dispose: () => {
      child.unref();
      closeSync(logFd);
    },
  };
}

export async function spawnHiddenProcess(
  args: SpawnHiddenProcessArgs,
): Promise<HiddenProcessHandle> {
  if (process.platform === "win32") {
    return spawnWindowsHiddenProcess(args);
  }

  return spawnPosixHiddenProcess(args);
}
