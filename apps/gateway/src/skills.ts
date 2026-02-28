import { mkdir, readdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { runtimeSkillsResponseSchema } from "@nexu/shared";
import { fetchJson } from "./api.js";
import { env } from "./env.js";
import { log } from "./log.js";
import type { RuntimeState } from "./state.js";
import { setSkillsSyncStatus } from "./state.js";

async function writeSkillFiles(
  skillsMap: Record<string, string>,
): Promise<void> {
  await mkdir(env.OPENCLAW_SKILLS_DIR, { recursive: true });

  const existing = await readdir(env.OPENCLAW_SKILLS_DIR, {
    withFileTypes: true,
  });
  const incomingNames = new Set(Object.keys(skillsMap));
  for (const entry of existing) {
    if (entry.isDirectory() && !incomingNames.has(entry.name)) {
      await rm(join(env.OPENCLAW_SKILLS_DIR, entry.name), {
        recursive: true,
        force: true,
      });
    }
  }

  for (const [name, content] of Object.entries(skillsMap)) {
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(name)) {
      throw new Error(`invalid skill name: ${name}`);
    }
    const dir = join(env.OPENCLAW_SKILLS_DIR, name);
    await mkdir(dir, { recursive: true });
    const target = join(dir, "SKILL.md");
    const temp = `${target}.tmp`;
    await writeFile(temp, content, "utf8");
    await rename(temp, target);
  }
}

export async function pollLatestSkills(state: RuntimeState): Promise<boolean> {
  const response = await fetchJson("/api/internal/skills/latest", {
    method: "GET",
  });
  const payload = runtimeSkillsResponseSchema.parse(response);

  if (payload.skillsHash === state.lastSkillsHash) {
    setSkillsSyncStatus(state, "active");
    return false;
  }

  await writeSkillFiles(payload.skills);
  state.lastSkillsHash = payload.skillsHash;
  setSkillsSyncStatus(state, "active");

  log("applied new skills snapshot", {
    version: payload.version,
    hash: payload.skillsHash,
  });

  return true;
}
