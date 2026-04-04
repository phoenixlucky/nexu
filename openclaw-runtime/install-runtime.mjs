import path from "node:path";
import { fileURLToPath } from "node:url";
import { installRepoLocalOpenClawRuntime } from "@nexu/openclaw-runtime/runtime-maintenance";

const runtimeDir = path.dirname(fileURLToPath(import.meta.url));

export async function installRuntime(mode = "pruned") {
  await installRepoLocalOpenClawRuntime({ runtimeDir, mode, logger: console });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2] ?? "pruned";

  if (mode !== "full" && mode !== "pruned") {
    throw new Error(`Unsupported install mode: ${mode}`);
  }

  await installRuntime(mode);
}
