/**
 * Launchd Bootstrap - Desktop startup using launchd process management
 *
 * This module handles the launchd-based startup sequence:
 * 1. Ensure launchd services are installed (Controller, OpenClaw)
 * 2. Start services via launchd
 * 3. Start embedded web server
 * 4. Handle graceful shutdown
 */

import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import {
  type EmbeddedWebServer,
  startEmbeddedWebServer,
} from "./embedded-web-server";
import { LaunchdManager, SERVICE_LABELS } from "./launchd-manager";
import { type PlistEnv, generatePlist } from "./plist-generator";

export interface LaunchdBootstrapEnv {
  /** Is this a development build */
  isDev: boolean;
  /** Controller HTTP port */
  controllerPort: number;
  /** Web UI port */
  webPort: number;
  /** Path to web static files */
  webRoot: string;
  /** Path to node binary */
  nodePath: string;
  /** Path to controller entry point */
  controllerEntryPath: string;
  /** Path to openclaw binary */
  openclawPath: string;
  /** OpenClaw config path */
  openclawConfigPath: string;
  /** OpenClaw state directory */
  openclawStateDir: string;
  /** Controller working directory */
  controllerCwd: string;
  /** OpenClaw working directory */
  openclawCwd: string;
  /** Plist directory (default: ~/Library/LaunchAgents or repo-local for dev) */
  plistDir?: string;
}

export interface LaunchdBootstrapResult {
  launchd: LaunchdManager;
  webServer: EmbeddedWebServer;
  labels: {
    controller: string;
    openclaw: string;
  };
}

/**
 * Get unified log directory path.
 */
export function getLogDir(): string {
  return path.join(os.homedir(), ".nexu", "logs");
}

/**
 * Ensure log directory exists.
 */
async function ensureLogDir(): Promise<string> {
  const logDir = getLogDir();
  await fs.mkdir(logDir, { recursive: true });
  return logDir;
}

/**
 * Wait for controller to be ready by polling health endpoint.
 */
async function waitForControllerReadiness(
  port: number,
  timeoutMs = 15000,
): Promise<void> {
  const startedAt = Date.now();
  const probeUrl = `http://127.0.0.1:${port}/api/auth/get-session`;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(probeUrl, {
        headers: { Accept: "application/json" },
      });
      if (response.status < 500) {
        console.log(
          `Controller ready via ${probeUrl} status=${response.status}`,
        );
        return;
      }
    } catch {
      // Ignore transient failures during startup
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  throw new Error(`Controller readiness probe timed out for ${probeUrl}`);
}

/**
 * Bootstrap desktop using launchd for process management.
 */
export async function bootstrapWithLaunchd(
  env: LaunchdBootstrapEnv,
): Promise<LaunchdBootstrapResult> {
  const logDir = await ensureLogDir();

  // Create launchd manager
  const launchd = new LaunchdManager({
    plistDir: env.plistDir,
  });

  const labels = {
    controller: SERVICE_LABELS.controller(env.isDev),
    openclaw: SERVICE_LABELS.openclaw(env.isDev),
  };

  // Prepare plist environment
  const plistEnv: PlistEnv = {
    isDev: env.isDev,
    logDir,
    controllerPort: env.controllerPort,
    openclawPort: 0, // OpenClaw uses config file, not port env
    nodePath: env.nodePath,
    controllerEntryPath: env.controllerEntryPath,
    openclawPath: env.openclawPath,
    openclawConfigPath: env.openclawConfigPath,
    openclawStateDir: env.openclawStateDir,
    controllerCwd: env.controllerCwd,
    openclawCwd: env.openclawCwd,
  };

  // 1. Ensure services are installed
  console.log("Installing launchd services...");

  if (!(await launchd.isServiceInstalled(labels.controller))) {
    const controllerPlist = generatePlist("controller", plistEnv);
    await launchd.installService(labels.controller, controllerPlist);
    console.log(`Installed ${labels.controller}`);
  }

  if (!(await launchd.isServiceInstalled(labels.openclaw))) {
    const openclawPlist = generatePlist("openclaw", plistEnv);
    await launchd.installService(labels.openclaw, openclawPlist);
    console.log(`Installed ${labels.openclaw}`);
  }

  // 2. Start Controller if not running
  console.log("Starting Controller...");
  const controllerStatus = await launchd.getServiceStatus(labels.controller);
  if (controllerStatus.status !== "running") {
    await launchd.startService(labels.controller);
  }
  await waitForControllerReadiness(env.controllerPort);
  console.log("Controller is ready");

  // 3. Start OpenClaw if not running
  console.log("Starting OpenClaw...");
  const openclawStatus = await launchd.getServiceStatus(labels.openclaw);
  if (openclawStatus.status !== "running") {
    await launchd.startService(labels.openclaw);
  }
  console.log("OpenClaw started");

  // 4. Start embedded Web Server
  console.log("Starting embedded web server...");
  const webServer = await startEmbeddedWebServer({
    port: env.webPort,
    webRoot: env.webRoot,
    controllerPort: env.controllerPort,
  });
  console.log(`Web server ready on http://127.0.0.1:${env.webPort}`);

  return {
    launchd,
    webServer,
    labels,
  };
}

/**
 * Gracefully stop all services managed by launchd.
 */
export async function stopAllServices(
  launchd: LaunchdManager,
  labels: { controller: string; openclaw: string },
): Promise<void> {
  console.log("Stopping OpenClaw...");
  await launchd.stopServiceGracefully(labels.openclaw);

  console.log("Stopping Controller...");
  await launchd.stopServiceGracefully(labels.controller);

  console.log("All services stopped");
}

/**
 * Check if launchd bootstrap is enabled.
 * Currently controlled by environment variable.
 */
export function isLaunchdBootstrapEnabled(): boolean {
  // Enable via env var for gradual rollout
  return process.env.NEXU_USE_LAUNCHD === "1";
}

/**
 * Get default plist directory based on environment.
 */
export function getDefaultPlistDir(isDev: boolean): string {
  if (isDev) {
    // Dev mode: use repo-local directory
    return path.join(process.cwd(), ".tmp", "launchd");
  }
  // Production: use standard LaunchAgents directory
  return path.join(os.homedir(), "Library", "LaunchAgents");
}

/**
 * Resolve paths for launchd bootstrap based on whether app is packaged.
 */
export function resolveLaunchdPaths(
  isPackaged: boolean,
  resourcesPath: string,
): {
  nodePath: string;
  controllerEntryPath: string;
  openclawPath: string;
  controllerCwd: string;
  openclawCwd: string;
} {
  if (isPackaged) {
    // Packaged app: use bundled resources
    const runtimeDir = path.join(resourcesPath, "runtime");
    return {
      nodePath: process.execPath,
      controllerEntryPath: path.join(
        runtimeDir,
        "controller",
        "dist",
        "index.js",
      ),
      openclawPath: path.join(runtimeDir, "openclaw-runtime", "openclaw.mjs"),
      controllerCwd: path.join(runtimeDir, "controller"),
      openclawCwd: runtimeDir,
    };
  }

  // Development: use local paths
  const repoRoot = process.cwd();
  return {
    nodePath: process.execPath,
    controllerEntryPath: path.join(
      repoRoot,
      "apps",
      "controller",
      "dist",
      "index.js",
    ),
    openclawPath: path.join(
      repoRoot,
      "openclaw-runtime",
      "node_modules",
      "openclaw",
      "openclaw.mjs",
    ),
    controllerCwd: path.join(repoRoot, "apps", "controller"),
    openclawCwd: repoRoot,
  };
}
