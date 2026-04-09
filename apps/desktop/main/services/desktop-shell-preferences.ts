import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { app } from "electron";

export type DesktopShellPreferences = {
  launchAtLogin: boolean;
  showInDock: boolean;
  supportsLaunchAtLogin: boolean;
  supportsShowInDock: boolean;
};

let runtimeApplyHandler:
  | ((preferences: DesktopShellPreferences) => void)
  | null = null;

type StoredDesktopShellPreferences = {
  launchAtLogin: boolean;
  showInDock: boolean;
};

const DEFAULT_PREFERENCES: StoredDesktopShellPreferences = {
  launchAtLogin: false,
  showInDock: true,
};

function getPreferencesFilePath(): string {
  return join(app.getPath("userData"), "desktop-shell-preferences.json");
}

function supportsLaunchAtLogin(): boolean {
  return process.platform === "darwin" || process.platform === "win32";
}

function supportsShowInDock(): boolean {
  return process.platform === "darwin" || process.platform === "win32";
}

function readStoredPreferences(): StoredDesktopShellPreferences {
  const filePath = getPreferencesFilePath();

  if (!existsSync(filePath)) {
    return DEFAULT_PREFERENCES;
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
    const candidate =
      typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, unknown>)
        : null;

    return {
      launchAtLogin:
        typeof candidate?.launchAtLogin === "boolean"
          ? candidate.launchAtLogin
          : DEFAULT_PREFERENCES.launchAtLogin,
      showInDock:
        typeof candidate?.showInDock === "boolean"
          ? candidate.showInDock
          : DEFAULT_PREFERENCES.showInDock,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function writeStoredPreferences(
  preferences: StoredDesktopShellPreferences,
): void {
  const filePath = getPreferencesFilePath();
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(preferences, null, 2), "utf8");
}

function getLaunchAtLoginState(
  storedPreferences: StoredDesktopShellPreferences,
): boolean {
  if (!supportsLaunchAtLogin()) {
    return storedPreferences.launchAtLogin;
  }

  try {
    return app.getLoginItemSettings().openAtLogin;
  } catch {
    return storedPreferences.launchAtLogin;
  }
}

export function getDesktopShellPreferences(): DesktopShellPreferences {
  const storedPreferences = readStoredPreferences();

  return {
    launchAtLogin: getLaunchAtLoginState(storedPreferences),
    showInDock: supportsShowInDock() ? storedPreferences.showInDock : true,
    supportsLaunchAtLogin: supportsLaunchAtLogin(),
    supportsShowInDock: supportsShowInDock(),
  };
}

function applyStoredPreferences(
  preferences: StoredDesktopShellPreferences,
): void {
  if (supportsLaunchAtLogin()) {
    try {
      app.setLoginItemSettings({
        openAtLogin: preferences.launchAtLogin,
      });
    } catch {
      // Ignore platform-specific failures and keep the stored preference.
    }
  }

  if (supportsShowInDock()) {
    if (preferences.showInDock) {
      void app.dock?.show();
    } else {
      app.dock?.hide();
    }
  }
}

export function applyDesktopShellPreferencesOnStartup(): void {
  const preferences = readStoredPreferences();
  applyStoredPreferences(preferences);
  runtimeApplyHandler?.(getDesktopShellPreferences());
}

export function updateDesktopShellPreferences(input: {
  launchAtLogin?: boolean;
  showInDock?: boolean;
}): DesktopShellPreferences {
  const storedPreferences = readStoredPreferences();
  const nextPreferences: StoredDesktopShellPreferences = {
    launchAtLogin:
      typeof input.launchAtLogin === "boolean"
        ? input.launchAtLogin
        : storedPreferences.launchAtLogin,
    showInDock:
      typeof input.showInDock === "boolean"
        ? input.showInDock
        : storedPreferences.showInDock,
  };

  writeStoredPreferences(nextPreferences);
  applyStoredPreferences(nextPreferences);
  const resolved = getDesktopShellPreferences();
  runtimeApplyHandler?.(resolved);
  return resolved;
}

export function setDesktopShellPreferencesRuntimeHandler(
  handler: ((preferences: DesktopShellPreferences) => void) | null,
): void {
  runtimeApplyHandler = handler;
}
