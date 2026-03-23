/**
 * Quit Handler - Desktop exit behavior with launchd services
 *
 * Provides quit dialog with options:
 * - Quit Completely: stop all launchd services and exit
 * - Run in Background: close GUI, keep services running
 * - Cancel: don't quit
 */

import { app, dialog } from "electron";
import type { EmbeddedWebServer } from "./embedded-web-server";
import type { LaunchdManager } from "./launchd-manager";

export interface QuitHandlerOptions {
  launchd: LaunchdManager;
  labels: {
    controller: string;
    openclaw: string;
  };
  webServer?: EmbeddedWebServer;
  /** Called before quitting to flush logs, etc */
  onBeforeQuit?: () => void | Promise<void>;
}

export type QuitDecision = "quit-completely" | "run-in-background" | "cancel";

/**
 * Show quit dialog and get user's choice.
 */
export async function showQuitDialog(): Promise<QuitDecision> {
  const { response } = await dialog.showMessageBox({
    type: "question",
    buttons: ["Quit Completely", "Run in Background", "Cancel"],
    defaultId: 0,
    title: "Quit Nexu",
    message: "Choose exit mode",
    detail:
      "Running in background keeps services running, bots continue working.\n\n" +
      "To fully stop services, choose 'Quit Completely'.",
  });

  switch (response) {
    case 0:
      return "quit-completely";
    case 1:
      return "run-in-background";
    default:
      return "cancel";
  }
}

/**
 * Install quit handler for launchd-managed services.
 */
export function installLaunchdQuitHandler(opts: QuitHandlerOptions): void {
  let isQuitting = false;

  app.on("before-quit", async (event) => {
    // Prevent recursive handling
    if (isQuitting) {
      return;
    }

    event.preventDefault();

    // In dev mode, skip dialog and keep services running (vite HMR restarts
    // Electron frequently; stopping services each time would cause needless
    // downtime). The dev-launchd.sh stop/clean commands use SIGKILL to bypass
    // this handler when a full stop is intended.
    const decision: QuitDecision = app.isPackaged
      ? await showQuitDialog()
      : "run-in-background";

    if (decision === "cancel") {
      return;
    }

    isQuitting = true;

    // Run cleanup callback
    if (opts.onBeforeQuit) {
      try {
        await opts.onBeforeQuit();
      } catch (err) {
        console.error("Error in onBeforeQuit:", err);
      }
    }

    // Close web server if running
    if (opts.webServer) {
      try {
        await opts.webServer.close();
      } catch (err) {
        console.error("Error closing web server:", err);
      }
    }

    if (decision === "quit-completely") {
      // Stop all launchd services
      console.log("Stopping launchd services...");

      try {
        await opts.launchd.stopServiceGracefully(opts.labels.openclaw);
        console.log(`Stopped ${opts.labels.openclaw}`);
      } catch (err) {
        console.error(`Error stopping ${opts.labels.openclaw}:`, err);
      }

      try {
        await opts.launchd.stopServiceGracefully(opts.labels.controller);
        console.log(`Stopped ${opts.labels.controller}`);
      } catch (err) {
        console.error(`Error stopping ${opts.labels.controller}:`, err);
      }
    } else {
      console.log("Keeping services running in background");
    }

    // Remove handler and quit
    app.removeAllListeners("before-quit");
    app.quit();
  });
}

/**
 * Programmatically quit with a specific decision (for testing or automation).
 */
export async function quitWithDecision(
  decision: "quit-completely" | "run-in-background",
  opts: QuitHandlerOptions,
): Promise<void> {
  if (opts.onBeforeQuit) {
    await opts.onBeforeQuit();
  }

  if (opts.webServer) {
    await opts.webServer.close();
  }

  if (decision === "quit-completely") {
    await opts.launchd.stopServiceGracefully(opts.labels.openclaw);
    await opts.launchd.stopServiceGracefully(opts.labels.controller);
  }

  app.quit();
}
