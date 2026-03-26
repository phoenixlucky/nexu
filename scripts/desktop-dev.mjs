import { spawn } from "node:child_process";
import { resolve } from "node:path";

const command = process.argv[2];

if (!command) {
  console.error("Usage: node scripts/desktop-dev.mjs <command>");
  process.exit(1);
}

const repoRoot = resolve(import.meta.dirname, "..");
const useLaunchd =
  process.platform === "darwin" && process.env.NEXU_USE_LAUNCHD !== "0";

const child = useLaunchd
  ? spawn("sh", [resolve(repoRoot, "scripts/dev-launchd.sh"), command], {
      cwd: repoRoot,
      stdio: "inherit",
      env: process.env,
    })
  : spawn(
      process.execPath,
      [resolve(repoRoot, "apps/desktop/scripts/dev-cli.mjs"), command],
      {
        cwd: repoRoot,
        stdio: "inherit",
        env: process.env,
      },
    );

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
