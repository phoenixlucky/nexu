#!/usr/bin/env node
/**
 * Batch-translate SkillHub catalog entries (name + description) to Chinese.
 * Outputs: apps/web/src/lib/skill-translations-zh.json
 *
 * Usage:
 *   LITELLM_BASE_URL=... LITELLM_API_KEY=... node scripts/generate-skill-translations.mjs
 *
 * Rate-limit strategy:
 *   - 20 skills per batch (keeps prompt small)
 *   - 1.5 s delay between calls
 *   - Exponential back-off on 429 / 5xx
 *   - Checkpoint every 50 batches so progress isn't lost
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = resolve(
  process.env.HOME,
  ".nexu/skillhub-cache/catalog.json",
);
const OUTPUT_PATH = resolve(
  __dirname,
  "../apps/web/src/lib/skill-translations-zh.json",
);
const CHECKPOINT_PATH = resolve(__dirname, "../.tmp/translation-checkpoint.json");

const BASE_URL = process.env.LITELLM_BASE_URL;
const API_KEY = process.env.LITELLM_API_KEY;
const BATCH_SIZE = 20;
const DELAY_MS = 1500;
const CHECKPOINT_EVERY = 50; // batches

if (!BASE_URL || !API_KEY) {
  console.error("Set LITELLM_BASE_URL and LITELLM_API_KEY env vars.");
  process.exit(1);
}

// ── helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function hasChineseChars(text) {
  return /[\u4e00-\u9fff]/.test(text);
}

async function callLLM(messages, retries = 4) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages,
          max_tokens: 4096,
          temperature: 0.3,
        }),
      });

      if (res.status === 429 || res.status >= 500) {
        const wait = DELAY_MS * 2 ** attempt;
        console.warn(
          `  ⚠ ${res.status} — retry ${attempt + 1}/${retries} in ${wait}ms`,
        );
        await sleep(wait);
        continue;
      }

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? "";
    } catch (err) {
      if (attempt === retries) throw err;
      const wait = DELAY_MS * 2 ** attempt;
      console.warn(
        `  ⚠ ${err.message.slice(0, 80)} — retry ${attempt + 1}/${retries} in ${wait}ms`,
      );
      await sleep(wait);
    }
  }
}

function buildPrompt(batch) {
  const items = batch
    .map(
      (s, i) =>
        `${i + 1}. slug: "${s.slug}" | name: "${s.name}" | desc: "${s.description}"`,
    )
    .join("\n");

  return `You are a professional translator. Translate the following skill names and descriptions from English to Simplified Chinese.

Rules:
- Keep brand names, product names, and technical abbreviations in their original form (e.g. GitHub, MCP, API, Docker)
- Translate the descriptive parts naturally into Chinese
- If the name is already a well-known brand, keep it as-is
- Keep translations concise — descriptions should be ≤150 characters
- Return ONLY a valid JSON array, no markdown fences, no explanation

Input:
${items}

Output format (JSON array, same order):
[{"slug":"...","name":"中文名","description":"中文描述"},...]`;
}

function parseResponse(text, batch) {
  // Strip markdown fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  try {
    const arr = JSON.parse(cleaned);
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (item) =>
        item &&
        typeof item.slug === "string" &&
        typeof item.name === "string" &&
        typeof item.description === "string",
    );
  } catch {
    console.warn("  ⚠ Failed to parse JSON response, skipping batch");
    return [];
  }
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Loading catalog...");
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
  console.log(`  Total skills: ${catalog.length}`);

  // Filter to English-only skills (skip those already in Chinese)
  const englishSkills = catalog.filter((s) => {
    const combined = `${s.name} ${s.description}`;
    return !hasChineseChars(combined) && combined.trim().length > 0;
  });
  console.log(`  English skills to translate: ${englishSkills.length}`);

  // Load existing translations (checkpoint or final output)
  let translations = {};
  if (existsSync(CHECKPOINT_PATH)) {
    translations = JSON.parse(readFileSync(CHECKPOINT_PATH, "utf8"));
    console.log(
      `  Resuming from checkpoint: ${Object.keys(translations).length} already translated`,
    );
  } else if (existsSync(OUTPUT_PATH)) {
    translations = JSON.parse(readFileSync(OUTPUT_PATH, "utf8"));
    console.log(
      `  Resuming from output: ${Object.keys(translations).length} already translated`,
    );
  }

  // Filter out already-translated skills
  const remaining = englishSkills.filter((s) => !translations[s.slug]);
  console.log(`  Remaining to translate: ${remaining.length}`);

  if (remaining.length === 0) {
    console.log("Nothing to translate. Writing final output...");
    writeFileSync(OUTPUT_PATH, JSON.stringify(translations, null, 2), "utf8");
    console.log(`Done: ${OUTPUT_PATH}`);
    return;
  }

  // Batch and translate
  const totalBatches = Math.ceil(remaining.length / BATCH_SIZE);
  console.log(
    `  Processing ${totalBatches} batches of ${BATCH_SIZE}...\n`,
  );

  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = remaining.slice(i, i + BATCH_SIZE);

    process.stdout.write(
      `  Batch ${batchNum}/${totalBatches} (${batch.length} skills)...`,
    );

    try {
      const prompt = buildPrompt(batch);
      const response = await callLLM([{ role: "user", content: prompt }]);
      const results = parseResponse(response, batch);

      let added = 0;
      for (const item of results) {
        if (item.slug && item.name && item.description) {
          translations[item.slug] = {
            name: item.name,
            description: item.description.slice(0, 150),
          };
          added++;
        }
      }
      console.log(` ✓ ${added}/${batch.length} translated`);
    } catch (err) {
      console.log(` ✗ ${err.message.slice(0, 80)}`);
    }

    // Checkpoint
    if (batchNum % CHECKPOINT_EVERY === 0) {
      writeFileSync(
        CHECKPOINT_PATH,
        JSON.stringify(translations, null, 2),
        "utf8",
      );
      console.log(
        `  📌 Checkpoint saved (${Object.keys(translations).length} translations)\n`,
      );
    }

    // Rate limit delay
    if (i + BATCH_SIZE < remaining.length) {
      await sleep(DELAY_MS);
    }
  }

  // Write final output
  writeFileSync(OUTPUT_PATH, JSON.stringify(translations, null, 2), "utf8");
  console.log(
    `\n✅ Done! ${Object.keys(translations).length} translations saved to:\n   ${OUTPUT_PATH}`,
  );

  // Clean up checkpoint
  if (existsSync(CHECKPOINT_PATH)) {
    const { unlinkSync } = await import("node:fs");
    unlinkSync(CHECKPOINT_PATH);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
