import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

export const repoRootPath = fileURLToPath(
  new URL("../../../", import.meta.url),
);

export const scriptsDevPath = join(repoRootPath, "scripts", "dev");
export const scriptsDevSourcePath = join(scriptsDevPath, "src");

export const controllerWorkingDirectoryPath = join(
  repoRootPath,
  "apps",
  "controller",
);
export const webWorkingDirectoryPath = join(repoRootPath, "apps", "web");

export const controllerSupervisorPath = join(
  scriptsDevSourcePath,
  "controller-supervisor.ts",
);
export const webSupervisorPath = join(
  scriptsDevSourcePath,
  "web-supervisor.ts",
);
export const controllerSourceDirectoryPath = join(
  controllerWorkingDirectoryPath,
  "src",
);

export const devTmpPath = join(repoRootPath, ".tmp", "dev");
export const devLogsPath = join(devTmpPath, "logs");
export const webDevLockPath = join(devTmpPath, "web.pid");
export const controllerDevLockPath = join(devTmpPath, "controller.pid");

export function getWebDevLogPath(runId: string): string {
  return join(devLogsPath, runId, "web.log");
}

export function getControllerDevLogPath(runId: string): string {
  return join(devLogsPath, runId, "controller.log");
}

export function getWindowsLauncherBatchPath(
  launcherDirectoryPath: string,
): string {
  return join(launcherDirectoryPath, "launcher.cmd");
}

export function getWindowsLauncherScriptPath(
  launcherDirectoryPath: string,
): string {
  return join(launcherDirectoryPath, "launcher.vbs");
}

export function getDevLauncherTempPrefix(): string {
  return join(tmpdir(), "nexu-dev-");
}

export function resolveTsxPaths(resolveFromPath: string = repoRootPath): {
  cliPath: string;
  loaderUrl: string;
  preflightPath: string;
} {
  const tsxPackageJsonPath = require.resolve("tsx/package.json", {
    paths: [resolveFromPath],
  });
  const tsxDistPath = join(dirname(tsxPackageJsonPath), "dist");

  return {
    cliPath: join(tsxDistPath, "cli.mjs"),
    loaderUrl: pathToFileURL(join(tsxDistPath, "loader.mjs")).href,
    preflightPath: join(tsxDistPath, "preflight.cjs"),
  };
}

export function resolveViteBinPath(): string {
  const vitePackageJsonPath = require.resolve("vite/package.json", {
    paths: [webWorkingDirectoryPath],
  });

  return join(dirname(vitePackageJsonPath), "bin", "vite.js");
}

export async function ensureParentDirectory(filePath: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
}

export async function ensureDirectory(directoryPath: string): Promise<void> {
  await mkdir(directoryPath, { recursive: true });
}

export function createRunId(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}
