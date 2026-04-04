import path from "node:path";

import { repoRootPath } from "@nexu/dev-utils";

export type OpenClawInstallLayout = {
  runtimePackageRoot: string;
  runtimeNodeModulesPath: string;
  runtimeEntryPath: string;
  runtimeBinPath: string;
  runtimeGatewayBinPath: string;
  runtimePackageJsonPath: string;
  runtimeLockfilePath: string;
  runtimePostinstallCachePath: string;
  criticalRuntimePaths: string[];
};

export function resolveRepoLocalOpenClawInstallLayout(
  workspaceRoot: string = repoRootPath,
): OpenClawInstallLayout {
  const runtimePackageRoot = path.join(workspaceRoot, "openclaw-runtime");
  const runtimeNodeModulesPath = path.join(runtimePackageRoot, "node_modules");

  return {
    runtimePackageRoot,
    runtimeNodeModulesPath,
    runtimeEntryPath: path.join(
      runtimeNodeModulesPath,
      "openclaw",
      "openclaw.mjs",
    ),
    runtimeBinPath: path.join(runtimePackageRoot, "bin", "openclaw"),
    runtimeGatewayBinPath: path.join(
      runtimePackageRoot,
      "bin",
      "openclaw-gateway",
    ),
    runtimePackageJsonPath: path.join(runtimePackageRoot, "package.json"),
    runtimeLockfilePath: path.join(runtimePackageRoot, "package-lock.json"),
    runtimePostinstallCachePath: path.join(
      runtimePackageRoot,
      ".postinstall-cache.json",
    ),
    criticalRuntimePaths: [
      path.join(runtimeNodeModulesPath, "openclaw", "dist"),
      path.join(
        runtimeNodeModulesPath,
        "@whiskeysockets",
        "baileys",
        "lib",
        "index.js",
      ),
      path.join(
        runtimeNodeModulesPath,
        "@whiskeysockets",
        "baileys",
        "WAProto",
        "index.js",
      ),
      path.join(
        runtimeNodeModulesPath,
        "@whiskeysockets",
        "baileys",
        "package.json",
      ),
    ],
  };
}
