import type { Dirent } from "node:fs";
import { readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { registerPool } from "./api.js";
import { fetchInitialConfig } from "./config.js";
import { env, envWarnings } from "./env.js";
import { waitGatewayReady } from "./gateway-health.js";
import { log } from "./log.js";
import { startManagedOpenclawGateway } from "./openclaw-process.js";
import { pollLatestSkills } from "./skills.js";
import type { RuntimeState } from "./state.js";
import { runWithRetry, sleep } from "./utils.js";

async function registerPoolWithRetry(): Promise<void> {
  return runWithRetry(
    registerPool,
    ({ attempt, retryDelayMs, error }) => {
      log("pool registration failed; retrying", {
        attempt,
        poolId: env.RUNTIME_POOL_ID,
        retryDelayMs,
        error: error instanceof Error ? error.message : "unknown_error",
      });
    },
    env.RUNTIME_MAX_BACKOFF_MS,
  );
}

async function fetchInitialConfigWithRetry(): Promise<void> {
  return runWithRetry(
    fetchInitialConfig,
    ({ attempt, retryDelayMs, error }) => {
      log("initial config sync failed; retrying", {
        attempt,
        poolId: env.RUNTIME_POOL_ID,
        retryDelayMs,
        error: error instanceof Error ? error.message : "unknown_error",
      });
    },
    env.RUNTIME_MAX_BACKOFF_MS,
  );
}

async function syncInitialSkillsWithRetry(state: RuntimeState): Promise<void> {
  return runWithRetry(
    () => pollLatestSkills(state).then(() => undefined),
    ({ attempt, retryDelayMs, error }) => {
      log("initial skills sync failed; retrying", {
        attempt,
        poolId: env.RUNTIME_POOL_ID,
        retryDelayMs,
        error: error instanceof Error ? error.message : "unknown_error",
      });
    },
    env.RUNTIME_MAX_BACKOFF_MS,
  );
}

async function clearStaleSessionLocks(): Promise<void> {
  if (!env.RUNTIME_MANAGE_OPENCLAW_PROCESS) {
    return; // external OpenClaw may have active locks
  }

  const agentsDir = join(env.OPENCLAW_STATE_DIR, "agents");

  let agentEntries: Dirent[];
  try {
    agentEntries = await readdir(agentsDir, { withFileTypes: true });
  } catch {
    return; // agents dir doesn't exist yet
  }

  let removed = 0;
  for (const entry of agentEntries) {
    if (!entry.isDirectory()) continue;
    const sessionsDir = join(agentsDir, entry.name, "sessions");
    let files: string[];
    try {
      files = await readdir(sessionsDir);
    } catch {
      continue;
    }
    for (const file of files) {
      if (!file.endsWith(".lock")) continue;
      await rm(join(sessionsDir, file), { force: true });
      removed++;
    }
  }

  if (removed > 0) {
    log("cleared stale session locks", { count: removed });
  }
}

async function rewriteSkillFiles(): Promise<void> {
  let entries: string[];
  try {
    entries = await readdir(env.OPENCLAW_SKILLS_DIR);
  } catch {
    return; // no skills dir
  }

  let rewritten = 0;
  for (const name of entries) {
    const skillMd = join(env.OPENCLAW_SKILLS_DIR, name, "SKILL.md");
    try {
      const content = await readFile(skillMd, "utf8");
      const temp = `${skillMd}.tmp`;
      await writeFile(temp, content, "utf8");
      await rename(temp, skillMd);
      rewritten++;
    } catch {
      // not a skill dir or no SKILL.md
    }
  }

  if (rewritten > 0) {
    log("rewrote skill files to trigger watcher", { count: rewritten });
  }
}

export async function bootstrapGateway(state: RuntimeState): Promise<void> {
  if (envWarnings.usedHostnameAsRuntimePoolId) {
    log("warning: RUNTIME_POOL_ID is unset; using hostname fallback", {
      nodeEnv: env.NODE_ENV,
      poolId: env.RUNTIME_POOL_ID,
    });
  }

  if (envWarnings.deprecatedGatewayHttpEnvKeys.length > 0) {
    log("deprecated gateway HTTP env vars detected and ignored", {
      keys: envWarnings.deprecatedGatewayHttpEnvKeys,
    });
  }

  if (envWarnings.openclawConfigPathSource === "state_dir_env") {
    log("OPENCLAW_CONFIG_PATH is unset; derived from OPENCLAW_STATE_DIR", {
      stateDir: envWarnings.openclawStateDir,
      configPath: envWarnings.openclawConfigPath,
    });
  }

  if (envWarnings.openclawConfigPathSource === "profile_default") {
    log("OPENCLAW_CONFIG_PATH is unset; derived from profile default", {
      profile: env.OPENCLAW_PROFILE,
      stateDir: envWarnings.openclawStateDir,
      configPath: envWarnings.openclawConfigPath,
    });
  }

  if (envWarnings.openclawConfigPathSource === "default") {
    log("OPENCLAW_CONFIG_PATH is unset; using ~/.openclaw/openclaw.json", {
      stateDir: envWarnings.openclawStateDir,
      configPath: envWarnings.openclawConfigPath,
    });
  }

  log("starting gateway", {
    poolId: env.RUNTIME_POOL_ID,
    configPath: env.OPENCLAW_CONFIG_PATH,
    manageOpenclawProcess: env.RUNTIME_MANAGE_OPENCLAW_PROCESS,
  });
  await registerPoolWithRetry();
  log("pool registered", { poolId: env.RUNTIME_POOL_ID });

  await fetchInitialConfigWithRetry();
  await syncInitialSkillsWithRetry(state);
  log("initial skills synced", { poolId: env.RUNTIME_POOL_ID });

  await clearStaleSessionLocks();

  if (env.RUNTIME_MANAGE_OPENCLAW_PROCESS) {
    startManagedOpenclawGateway();
  }

  await waitGatewayReady();
  await sleep(2000);
  await rewriteSkillFiles();
}
