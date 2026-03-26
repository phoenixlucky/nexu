import { createManagedRuntimePlatformAdapter } from "../shared/runtime-common";

export function createWindowsRuntimePlatformAdapter() {
  return createManagedRuntimePlatformAdapter("win");
}
