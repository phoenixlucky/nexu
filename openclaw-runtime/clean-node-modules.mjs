import path from "node:path";
import { fileURLToPath } from "node:url";
import { cleanRepoLocalOpenClawRuntimeNodeModules } from "@nexu/openclaw-runtime/runtime-maintenance";

const runtimeDir = path.dirname(fileURLToPath(import.meta.url));
const isDryRun = process.argv.includes("--dry-run");

await cleanRepoLocalOpenClawRuntimeNodeModules({
  runtimeDir,
  dryRun: isDryRun,
  logger: console,
});
