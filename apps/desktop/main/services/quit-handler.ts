/**
 * Quit Handler - Desktop exit behavior with launchd services
 *
 * Window close (red traffic light) -> hide to background, services keep running.
 * Cmd+Q / Dock Quit -> full teardown and exit.
 */

import { BrowserWindow, app } from "electron";
import type { DesktopRuntimeSupervisor } from "../platforms/types";
import type { EmbeddedWebServer } from "./embedded-web-server";
import { deleteRuntimePorts } from "./launchd-bootstrap";

export interface QuitHandlerOptions {
  launchd: DesktopRuntimeSupervisor;
  labels: {
    controller: string;
    openclaw: string;
  };
  webServer?: EmbeddedWebServer;
  /** Plist directory for runtime-ports.json cleanup */
  plistDir?: string;
  /** Called before quitting to flush logs, etc */
  onBeforeQuit?: () => void | Promise<void>;
  /** Called to signal that the app should actually close windows on quit */
  onForceQuit?: () => void;
  /** Optional lifecycle-owned override for quit completely */
  onQuitCompletely?: () =>
    | void
    | Promise<void>
    | Promise<{ handled: boolean }>
    | { handled: boolean };
  /** Optional lifecycle-owned override for backgrounding */
  onRunInBackground?: () =>
    | void
    | Promise<void>
    | Promise<{ handled: boolean }>
    | { handled: boolean };
}

export type QuitDecision = "quit-completely" | "run-in-background";

async function wasHandled(
  result:
    | void
    | { handled: boolean }
    | Promise<void>
    | Promise<{ handled: boolean }>,
): Promise<boolean> {
  const resolved = await result;
  return resolved?.handled ?? false;
}

async function runTeardownAndExit(
  opts: QuitHandlerOptions,
  reason: string,
): Promise<void> {
  try {
    await opts.onBeforeQuit?.();
  } catch (error) {
    console.error(`Error in onBeforeQuit (${reason}):`, error);
  }

  try {
    await opts.webServer?.close();
  } catch (error) {
    console.error(`Error closing web server (${reason}):`, error);
  }

  for (const label of [opts.labels.openclaw, opts.labels.controller]) {
    try {
      await opts.launchd.bootoutService(label);
    } catch (error) {
      console.error(`Error booting out ${label}:`, error);
    }

    try {
      await opts.launchd.waitForExit(label, 5000);
    } catch (error) {
      console.warn(
        `waitForExit ${label} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (opts.plistDir) {
    await deleteRuntimePorts(opts.plistDir).catch(() => undefined);
  }

  (app as unknown as Record<string, unknown>).__nexuForceQuit = true;
  opts.onForceQuit?.();
  app.exit(0);
}

/**
 * Install quit handler for launchd-managed services.
 *
 * Uses the window "close" event as the backgrounding entry point and
 * `before-quit` as the full-exit entry point.
 */
export function installLaunchdQuitHandler(opts: QuitHandlerOptions): void {
  const interceptWindowClose = (window: BrowserWindow) => {
    window.on("close", (event) => {
      if ((app as unknown as Record<string, unknown>).__nexuForceQuit) {
        return;
      }

      if (!app.isPackaged) {
        event.preventDefault();
        void runTeardownAndExit(opts, "dev-close");
        return;
      }

      event.preventDefault();
      void (async () => {
        if (await wasHandled(opts.onRunInBackground?.())) {
          return;
        }
        window.hide();
      })();
    });
  };

  const mainWin = BrowserWindow.getAllWindows()[0];
  if (mainWin) {
    interceptWindowClose(mainWin);
  }

  app.on("before-quit", (event) => {
    if ((app as unknown as Record<string, unknown>).__nexuForceQuit) {
      return;
    }

    event.preventDefault();
    void (async () => {
      if (await wasHandled(opts.onQuitCompletely?.())) {
        return;
      }

      await runTeardownAndExit(
        opts,
        app.isPackaged ? "packaged-quit" : "dev-before-quit",
      );
    })();
  });
}

/**
 * Programmatically quit with a specific decision (for testing or automation).
 */
export async function quitWithDecision(
  decision: QuitDecision,
  opts: QuitHandlerOptions,
): Promise<void> {
  if (decision === "quit-completely") {
    if (await wasHandled(opts.onQuitCompletely?.())) {
      return;
    }

    await runTeardownAndExit(opts, "programmatic-quit");
    return;
  }

  if (await wasHandled(opts.onRunInBackground?.())) {
    return;
  }

  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    win.hide();
  }
}
