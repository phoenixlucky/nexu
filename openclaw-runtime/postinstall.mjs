import path from "node:path";
import { fileURLToPath } from "node:url";
import { runRepoLocalOpenClawRuntimePostinstall } from "@nexu/openclaw-runtime/runtime-maintenance";
import {
  cacheFileName,
  computeFingerprint,
  criticalRuntimeFiles,
  pruneTargets,
} from "@nexu/openclaw-runtime/runtime-policy";

const runtimeDir = path.dirname(fileURLToPath(import.meta.url));
const nodeModulesDir = path.join(runtimeDir, "node_modules");
const cacheFilePath = path.join(runtimeDir, cacheFileName);

try {
  const fingerprint = await computeFingerprint(runtimeDir);
  await runRepoLocalOpenClawRuntimePostinstall({
    runtimeDir,
    nodeModulesDir,
    cacheFilePath,
    criticalRuntimeFiles,
    pruneTargets,
    fingerprint,
    logger: console,
  });
} catch (error) {
  console.error("openclaw-runtime postinstall failed.");
  throw error;
}
