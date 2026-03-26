import crypto from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  buildDispatchPayload,
  createBridgeServer,
  dispatchProjectItemEvent,
  verifyGitHubSignature,
} from "../../scripts/notify/github-project-webhook-bridge.mjs";

describe("github-project-webhook-bridge", () => {
  it("builds a compact repository_dispatch payload", () => {
    expect(
      buildDispatchPayload({
        action: "edited",
        changes: {
          field_value: {
            field_name: "Status",
            from: { name: "Todo" },
            to: { name: "In Progress" },
          },
        },
        projects_v2_item: {
          node_id: "PVTITEM_123",
          project_number: 42,
        },
        sender: { login: "mrcfps" },
        organization: { login: "nexu-io" },
      }),
    ).toEqual({
      action: "edited",
      changes: {
        field_value: {
          field_name: "Status",
          from: { name: "Todo" },
          to: { name: "In Progress" },
        },
      },
      item_node_id: "PVTITEM_123",
      project_number: "42",
      sender: "mrcfps",
      org_or_user: "nexu-io",
    });
  });

  it("verifies sha256 GitHub webhook signatures", () => {
    const rawBody = Buffer.from('{"action":"edited"}', "utf8");
    const secret = "bridge-secret";
    const signature = `sha256=${crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex")}`;

    expect(verifyGitHubSignature({ rawBody, signature, secret })).toBe(true);
    expect(
      verifyGitHubSignature({
        rawBody,
        signature: "sha256=deadbeef",
        secret,
      }),
    ).toBe(false);
  });

  it("dispatches repository_dispatch with the expected payload", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      text: async () => "",
    });

    await dispatchProjectItemEvent({
      owner: "nexu-io",
      repo: "nexu",
      token: "ghs_test",
      clientPayload: { item_node_id: "PVTITEM_123" },
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.github.com/repos/nexu-io/nexu/dispatches",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer ghs_test",
        }),
      }),
    );

    const [, options] = fetchImpl.mock.calls[0] as [string, { body: string }];
    expect(JSON.parse(options.body)).toEqual({
      event_type: "projects_v2_item",
      client_payload: { item_node_id: "PVTITEM_123" },
    });
  });

  it("returns 202 for unsupported GitHub events without dispatching", async () => {
    const fetchImpl = vi.fn();
    const server = createBridgeServer({
      owner: "nexu-io",
      repo: "nexu",
      token: "ghs_test",
      webhookSecret: "",
      fetchImpl,
    });

    const requestHandler = server.listeners("request")[0] as unknown as (
      req: unknown,
      res: unknown,
    ) => Promise<void> | void;
    const req = createMockRequest({
      method: "POST",
      url: "/github/projects-v2-item",
      headers: { "x-github-event": "issues" },
      body: JSON.stringify({ action: "opened" }),
    });
    const res = createMockResponse();

    await requestHandler(req, res);

    expect(res.statusCode).toBe(202);
    expect(fetchImpl).not.toHaveBeenCalled();
    server.close();
  });
});

function createMockRequest({
  method,
  url,
  headers,
  body,
}: {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
}) {
  return {
    method,
    url,
    headers,
    async *[Symbol.asyncIterator]() {
      yield Buffer.from(body, "utf8");
    },
  };
}

function createMockResponse() {
  return {
    statusCode: 200,
    body: "",
    writeHead(statusCode: number) {
      this.statusCode = statusCode;
      return this;
    },
    end(body?: string) {
      this.body = body ?? "";
      return this;
    },
  };
}
