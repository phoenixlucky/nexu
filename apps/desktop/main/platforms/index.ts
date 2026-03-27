import { createDefaultPlatformCapabilities } from "./default/capabilities";
import {
  createFallbackMacRuntimePlatformAdapter,
  createMacRuntimePlatformAdapter,
  shouldUseMacLaunchdRuntime,
} from "./mac/runtime";
import { createManagedRuntimePlatformAdapter } from "./shared/runtime-common";
import { createWindowsRuntimePlatformAdapter } from "./win/runtime";

export function getDesktopRuntimePlatformAdapter() {
  if (shouldUseMacLaunchdRuntime()) {
    return createMacRuntimePlatformAdapter();
  }

  if (process.platform === "darwin") {
    return createFallbackMacRuntimePlatformAdapter();
  }

  if (process.platform === "win32") {
    return createWindowsRuntimePlatformAdapter();
  }

  return createManagedRuntimePlatformAdapter(
    "default",
    createDefaultPlatformCapabilities(),
  );
}
