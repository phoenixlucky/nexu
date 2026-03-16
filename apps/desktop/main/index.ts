import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BrowserWindow, app, shell } from "electron";
import { waitForDesktopRendererReady } from "../shared/renderer-ready";
import { resolveDesktopRendererUrl } from "../shared/renderer-url";
import { getDesktopAppRoot } from "../shared/workspace-paths";
import { bootstrapDesktopAuthSession } from "./desktop-bootstrap";
import { registerIpcHandlers } from "./ipc";
import { RuntimeOrchestrator } from "./runtime/daemon-supervisor";
import { createRuntimeUnitManifests } from "./runtime/manifests";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const electronRoot = getDesktopAppRoot();
const rendererUrl = resolveDesktopRendererUrl(process.env);

// Load .env from the desktop app root into process.env (no-override).
const dotenvPath = resolve(electronRoot, ".env");
if (existsSync(dotenvPath)) {
  for (const line of readFileSync(dotenvPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}
const orchestrator = new RuntimeOrchestrator(
  createRuntimeUnitManifests(electronRoot, app.getPath("userData")),
);

app.setName("Nexu Desktop");

let mainWindow: BrowserWindow | null = null;

function safeWrite(stream: NodeJS.WriteStream, message: string): void {
  if (stream.destroyed || !stream.writable) {
    return;
  }

  try {
    stream.write(message);
  } catch (error) {
    const errorCode =
      error instanceof Error && "code" in error ? String(error.code) : null;
    if (errorCode === "EIO" || errorCode === "EPIPE") {
      return;
    }
    throw error;
  }
}

function focusMainWindow(): void {
  if (!mainWindow) {
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.focus();
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
}

app.on("second-instance", () => {
  focusMainWindow();
});

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1400,
    height: 920,
    minWidth: 1120,
    minHeight: 760,
    backgroundColor: "#0B1020",
    title: "Nexu Desktop",
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  window.webContents.on(
    "console-message",
    (_event, level, message, line, sourceId) => {
      const levelLabel =
        ["verbose", "info", "warning", "error"][level] ?? String(level);
      safeWrite(
        process.stdout,
        `[renderer:${levelLabel}] ${message} (${sourceId}:${line})\n`,
      );
    },
  );

  window.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedUrl) => {
      safeWrite(
        process.stderr,
        `[renderer:fail-load] ${errorCode} ${errorDescription} ${validatedUrl}\n`,
      );
    },
  );

  window.webContents.on("did-finish-load", () => {
    safeWrite(
      process.stdout,
      `[renderer] did-finish-load ${window.webContents.getURL()}\n`,
    );
  });

  window.webContents.on("render-process-gone", (_event, details) => {
    safeWrite(
      process.stderr,
      `[renderer:gone] reason=${details.reason} exitCode=${details.exitCode}\n`,
    );
  });

  window.once("ready-to-show", () => {
    window.show();
    focusMainWindow();
  });

  window.on("closed", () => {
    if (mainWindow === window) {
      mainWindow = null;
    }
  });

  mainWindow = window;
  return window;
}

app.whenReady().then(async () => {
  registerIpcHandlers(orchestrator);
  const window = createMainWindow();

  void (async () => {
    try {
      await orchestrator.startAutoStartManagedUnits();
      await waitForDesktopRendererReady(rendererUrl);
      await window.loadURL(rendererUrl);
    } catch (error) {
      safeWrite(
        process.stderr,
        `[runtime:start-all] ${error instanceof Error ? error.message : String(error)}\n`,
      );
      return;
    }

    try {
      await bootstrapDesktopAuthSession();
      // Reload the window so it picks up the session cookies set by bootstrap.
      // Without this, the page loads before auth completes and shows the login form.
      mainWindow?.webContents.reload();
    } catch (error) {
      safeWrite(
        process.stderr,
        `[desktop:auth-bootstrap] ${error instanceof Error ? error.message : String(error)}\n`,
      );
    }
  })();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
      return;
    }

    focusMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  void orchestrator.dispose();
});
