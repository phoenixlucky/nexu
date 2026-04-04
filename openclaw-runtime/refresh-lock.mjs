import path from "node:path";
import { fileURLToPath } from "node:url";

import { refreshRepoLocalOpenClawRuntimeLock } from "@nexu/openclaw-runtime/runtime-maintenance";

import { pruneTargets } from "@nexu/openclaw-runtime/runtime-policy";

const runtimeDir = path.dirname(fileURLToPath(import.meta.url));

await refreshRepoLocalOpenClawRuntimeLock({
  runtimeDir,
  pruneTargets,
  logger: console,
});
