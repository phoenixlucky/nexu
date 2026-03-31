#!/usr/bin/env node
/**
 * Mock update server for testing the desktop auto-update UI flow.
 *
 * Usage:
 *   node scripts/mock-update-server.mjs [--version 9.9.9] [--port 8899]
 *
 * Then launch the desktop app with:
 *   NEXU_UPDATE_FEED_URL=http://127.0.0.1:8899 pnpm dev:desktop
 *
 * The server serves a fake latest-mac.yml that advertises the given version.
 * When electron-updater tries to download the .zip, the server streams a slow
 * fake payload (~30s) so you can observe the progress bar in the UI.
 */

import { createServer } from "node:http";

const args = process.argv.slice(2);
function getArg(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

const VERSION = getArg("version", "9.9.9");
const PORT = Number(getArg("port", "8899"));
const FAKE_SIZE = 50 * 1024 * 1024; // 50 MB fake download
const CHUNK_SIZE = 256 * 1024; // 256 KB per chunk
const CHUNK_DELAY_MS = 200; // throttle to simulate real download

// electron-updater expects this YAML at /latest-mac.yml
const latestYml = `version: ${VERSION}
files:
  - url: nexu-${VERSION}-arm64.zip
    sha512: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
    size: ${FAKE_SIZE}
path: nexu-${VERSION}-arm64.zip
sha512: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
releaseDate: ${new Date().toISOString()}
`;

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  console.log(`${req.method} ${url.pathname}`);

  // Serve update metadata
  if (url.pathname.endsWith("latest-mac.yml")) {
    res.writeHead(200, {
      "Content-Type": "text/yaml",
      "Content-Length": Buffer.byteLength(latestYml),
    });
    res.end(latestYml);
    return;
  }

  // Serve fake .zip download (slow-streamed)
  if (url.pathname.endsWith(".zip")) {
    console.log(`  Streaming fake ${FAKE_SIZE} bytes at ~${Math.round(CHUNK_SIZE / 1024)}KB / ${CHUNK_DELAY_MS}ms`);
    res.writeHead(200, {
      "Content-Type": "application/zip",
      "Content-Length": String(FAKE_SIZE),
    });

    let sent = 0;
    const interval = setInterval(() => {
      const remaining = FAKE_SIZE - sent;
      const size = Math.min(CHUNK_SIZE, remaining);
      const chunk = Buffer.alloc(size, 0);
      res.write(chunk);
      sent += size;

      if (sent >= FAKE_SIZE) {
        clearInterval(interval);
        res.end();
        console.log(`  Download complete (${sent} bytes)`);
      }
    }, CHUNK_DELAY_MS);

    req.on("close", () => {
      clearInterval(interval);
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`\nMock update server running at http://127.0.0.1:${PORT}`);
  console.log(`  Advertising version: ${VERSION}`);
  console.log(`  Current app version: 0.1.7 (will see update available)`);
  console.log(`\nLaunch desktop with:`);
  console.log(`  NEXU_UPDATE_FEED_URL=http://127.0.0.1:${PORT} pnpm dev:desktop\n`);
});
