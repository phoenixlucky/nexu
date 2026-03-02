import crypto from "node:crypto";
import { createId } from "@paralleldrive/cuid2";
import { desc, eq } from "drizzle-orm";
import type { Database } from "../../db/index.js";
import { skills, skillsSnapshots } from "../../db/schema/index.js";

interface SkillsSnapshotRecord {
  id: string;
  version: number;
  skillsHash: string;
  skills: Record<string, Record<string, string>>;
  createdAt: string;
}

export function toSkillsHash(
  skillsMap: Record<string, Record<string, string>>,
): string {
  const sorted: Record<string, Record<string, string>> = {};
  for (const [name, files] of Object.entries(skillsMap).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    sorted[name] = Object.fromEntries(
      Object.entries(files).sort(([a], [b]) => a.localeCompare(b)),
    );
  }
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(sorted))
    .digest("hex");
}

const MAX_PUBLISH_RETRIES = 5;

export async function publishSkillsSnapshot(
  db: Database,
): Promise<SkillsSnapshotRecord> {
  const activeSkills = await db
    .select({
      name: skills.name,
      content: skills.content,
      files: skills.files,
    })
    .from(skills)
    .where(eq(skills.status, "active"))
    .orderBy(skills.name);

  const skillsMap: Record<string, Record<string, string>> = {};
  for (const skill of activeSkills) {
    if (skill.files && skill.files !== "{}") {
      try {
        skillsMap[skill.name] = JSON.parse(skill.files);
      } catch {
        skillsMap[skill.name] = { "SKILL.md": skill.content };
      }
    } else {
      skillsMap[skill.name] = { "SKILL.md": skill.content };
    }
  }

  const skillsHash = toSkillsHash(skillsMap);
  const skillsJson = JSON.stringify(skillsMap);

  for (let attempt = 0; attempt < MAX_PUBLISH_RETRIES; attempt++) {
    // Check if latest snapshot already has this hash (dedup)
    const [latest] = await db
      .select()
      .from(skillsSnapshots)
      .orderBy(desc(skillsSnapshots.version))
      .limit(1);

    if (latest && latest.skillsHash === skillsHash) {
      return {
        id: latest.id,
        version: latest.version,
        skillsHash: latest.skillsHash,
        skills: JSON.parse(latest.skillsJson) as Record<
          string,
          Record<string, string>
        >,
        createdAt: latest.createdAt,
      };
    }

    const nextVersion = (latest?.version ?? 0) + 1;
    const now = new Date().toISOString();

    await db
      .insert(skillsSnapshots)
      .values({
        id: createId(),
        version: nextVersion,
        skillsHash,
        skillsJson,
        createdAt: now,
      })
      .onConflictDoNothing();

    // Re-query by version — verify it's our hash (another writer may have won)
    const [committed] = await db
      .select()
      .from(skillsSnapshots)
      .where(eq(skillsSnapshots.version, nextVersion))
      .limit(1);

    if (committed && committed.skillsHash === skillsHash) {
      return {
        id: committed.id,
        version: committed.version,
        skillsHash: committed.skillsHash,
        skills: JSON.parse(committed.skillsJson) as Record<
          string,
          Record<string, string>
        >,
        createdAt: committed.createdAt,
      };
    }

    // Version was taken by another writer with different hash — retry
  }

  throw new Error("publishSkillsSnapshot: max retries exceeded");
}

export async function getLatestSkillsSnapshot(
  db: Database,
): Promise<SkillsSnapshotRecord> {
  const [latest] = await db
    .select()
    .from(skillsSnapshots)
    .orderBy(desc(skillsSnapshots.version))
    .limit(1);

  if (latest) {
    const parsed = JSON.parse(latest.skillsJson);
    const firstValue = Object.values(parsed)[0];
    // Detect old flat format: value is a string instead of an object
    if (typeof firstValue === "string") {
      return publishSkillsSnapshot(db);
    }
    return {
      id: latest.id,
      version: latest.version,
      skillsHash: latest.skillsHash,
      skills: parsed as Record<string, Record<string, string>>,
      createdAt: latest.createdAt,
    };
  }

  return publishSkillsSnapshot(db);
}
