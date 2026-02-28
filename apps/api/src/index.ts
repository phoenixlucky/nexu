import "./datadog.js";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import dotenv from "dotenv";

function loadEnv() {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const apiDir = resolve(moduleDir, "..");
  const candidates = [resolve(process.cwd(), ".env"), resolve(apiDir, ".env")];

  for (const path of candidates) {
    if (!existsSync(path)) {
      continue;
    }

    dotenv.config({
      path,
      override: false,
    });
  }
}

async function main() {
  loadEnv();

  // Dynamic imports: modules that read process.env at init time (db, auth)
  // must load AFTER loadEnv() populates the environment.
  const { migrate } = await import("./db/migrate.js");
  await migrate();

  if (process.env.AUTO_SEED === "true") {
    const { seedDev } = await import("./db/seed-dev.js");
    await seedDev();
  }

  const { createApp } = await import("./app.js");
  const app = createApp();
  const port = Number.parseInt(process.env.PORT ?? "3000", 10);

  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`Nexu API listening on http://localhost:${info.port}`);
  });
}

main().catch(console.error);
