#!/usr/bin/env node

import crypto from "node:crypto";
import http from "node:http";
import { pathToFileURL } from "node:url";

const DEFAULT_EVENT_TYPE = "projects_v2_item";
const DEFAULT_PATH = "/github/projects-v2-item";
const DEFAULT_PORT = 8787;

export function parseRequiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export function verifyGitHubSignature({ rawBody, signature, secret }) {
  if (!secret) {
    return true;
  }

  if (!signature) {
    return false;
  }

  const expected = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")}`;

  const providedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

export function buildDispatchPayload(webhookPayload) {
  const item = webhookPayload?.projects_v2_item;
  if (!item?.node_id) {
    throw new Error("projects_v2_item.node_id is required");
  }

  return {
    action: webhookPayload?.action ?? "edited",
    changes: webhookPayload?.changes ?? {},
    item_node_id: item.node_id,
    project_number:
      typeof item.project_number === "number"
        ? String(item.project_number)
        : (item.project_number ?? ""),
    sender: webhookPayload?.sender?.login ?? "github",
    org_or_user:
      webhookPayload?.organization?.login ??
      webhookPayload?.sender?.login ??
      "",
  };
}

export async function dispatchProjectItemEvent({
  owner,
  repo,
  token,
  clientPayload,
  eventType = DEFAULT_EVENT_TYPE,
  fetchImpl = fetch,
}) {
  const response = await fetchImpl(
    `https://api.github.com/repos/${owner}/${repo}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        event_type: eventType,
        client_payload: clientPayload,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`repository_dispatch failed (${response.status}): ${body}`);
  }
}

export function createBridgeServer({
  owner,
  repo,
  token,
  webhookSecret,
  eventType = DEFAULT_EVENT_TYPE,
  routePath = DEFAULT_PATH,
  fetchImpl = fetch,
}) {
  return http.createServer(async (req, res) => {
    if (req.method !== "POST" || req.url !== routePath) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Not found" }));
      return;
    }

    const eventName = req.headers["x-github-event"];
    if (eventName !== DEFAULT_EVENT_TYPE) {
      res.writeHead(202, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ message: `Ignored event: ${eventName ?? "unknown"}` }),
      );
      return;
    }

    const chunks = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const rawBody = Buffer.concat(chunks);

    const signatureHeader = req.headers["x-hub-signature-256"];
    const signature =
      typeof signatureHeader === "string" ? signatureHeader : undefined;

    if (
      !verifyGitHubSignature({
        rawBody,
        signature,
        secret: webhookSecret,
      })
    ) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Invalid signature" }));
      return;
    }

    let webhookPayload;
    try {
      webhookPayload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Invalid JSON payload" }));
      return;
    }

    try {
      const clientPayload = buildDispatchPayload(webhookPayload);
      await dispatchProjectItemEvent({
        owner,
        repo,
        token,
        clientPayload,
        eventType,
        fetchImpl,
      });

      res.writeHead(202, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "repository_dispatch queued",
          action: clientPayload.action,
          item_node_id: clientPayload.item_node_id,
        }),
      );
    } catch (error) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: error instanceof Error ? error.message : "Dispatch failed",
        }),
      );
    }
  });
}

export async function main() {
  const token = parseRequiredEnv("GITHUB_REPOSITORY_DISPATCH_TOKEN");
  const repoSlug = parseRequiredEnv("GITHUB_REPOSITORY_DISPATCH_REPO");
  const [owner, repo] = repoSlug.split("/");

  if (!owner || !repo) {
    throw new Error(
      "GITHUB_REPOSITORY_DISPATCH_REPO must be in the form owner/repo",
    );
  }

  const portValue = process.env.PORT?.trim();
  const port = portValue ? Number(portValue) : DEFAULT_PORT;
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive integer");
  }

  const routePath =
    process.env.GITHUB_PROJECTS_V2_WEBHOOK_PATH?.trim() || DEFAULT_PATH;
  const eventType =
    process.env.GITHUB_REPOSITORY_DISPATCH_EVENT_TYPE?.trim() ||
    DEFAULT_EVENT_TYPE;
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET?.trim() || "";

  const server = createBridgeServer({
    owner,
    repo,
    token,
    webhookSecret,
    eventType,
    routePath,
  });

  await new Promise((resolve) => {
    server.listen(port, "0.0.0.0", resolve);
  });

  console.log(
    `GitHub Projects v2 bridge listening on http://0.0.0.0:${port}${routePath}`,
  );
}

if (process.argv[1]) {
  const entryHref = pathToFileURL(process.argv[1]).href;
  if (import.meta.url === entryHref) {
    main().catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    });
  }
}
