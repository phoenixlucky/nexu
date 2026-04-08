import { describe, expect, it } from "vitest";
import type { ControllerEnv } from "../src/app/env.js";
import {
  OpenClawProcessManager,
  type OpenClawRuntimeEvent,
} from "../src/runtime/openclaw-process.js";

function createEventSink() {
  const events: OpenClawRuntimeEvent[] = [];
  return {
    emitRuntimeEvent(event: OpenClawRuntimeEvent) {
      events.push(event);
    },
    events,
  };
}

function createTestEnv(): ControllerEnv {
  return {
    nodeEnv: "test",
    port: 3010,
    host: "127.0.0.1",
    webUrl: "http://localhost:5173",
    nexuHomeDir: "C:/tmp/.nexu",
    nexuConfigPath: "C:/tmp/.nexu/config.json",
    artifactsIndexPath: "C:/tmp/.nexu/artifacts/index.json",
    compiledOpenclawSnapshotPath: "C:/tmp/.nexu/compiled-openclaw.json",
    openclawStateDir: "C:/tmp/.openclaw",
    openclawConfigPath: "C:/tmp/.openclaw/openclaw.json",
    openclawSkillsDir: "C:/tmp/.openclaw/skills",
    userSkillsDir: "C:/tmp/.agents/skills",
    openclawBuiltinExtensionsDir: null,
    openclawExtensionsDir: "C:/tmp/.openclaw/extensions",
    bundledRuntimePluginsDir: "C:/tmp/plugins",
    runtimePluginTemplatesDir: "C:/tmp/runtime-plugins",
    openclawRuntimeModelStatePath: "C:/tmp/.openclaw/nexu-runtime-model.json",
    creditGuardStatePath: "C:/tmp/.openclaw/nexu-credit-guard-state.json",
    skillhubCacheDir: "C:/tmp/.nexu/skillhub-cache",
    skillDbPath: "C:/tmp/.nexu/skill-ledger.json",
    analyticsStatePath: "C:/tmp/.nexu/analytics-state.json",
    staticSkillsDir: undefined,
    platformTemplatesDir: undefined,
    openclawWorkspaceTemplatesDir: "C:/tmp/.openclaw/workspace-templates",
    openclawOwnershipMode: "external",
    openclawBaseUrl: "http://127.0.0.1:18789",
    openclawBin: "openclaw",
    openclawLogDir: "C:/tmp/.nexu/logs/openclaw",
    openclawLaunchdLabel: null,
    litellmBaseUrl: null,
    litellmApiKey: null,
    openclawGatewayPort: 18789,
    openclawGatewayToken: undefined,
    manageOpenclawProcess: false,
    gatewayProbeEnabled: false,
    runtimeSyncIntervalMs: 2000,
    runtimeHealthIntervalMs: 5000,
    defaultModelId: "anthropic/claude-sonnet-4",
    posthogApiKey: undefined,
    posthogHost: undefined,
    amplitudeApiKey: undefined,
  };
}

function emitRuntimeEventFromLine(
  manager: OpenClawProcessManager,
  line: string,
): void {
  (
    manager as unknown as { emitRuntimeEventFromLine: (line: string) => void }
  ).emitRuntimeEventFromLine(line);
}

describe("OpenClawProcessManager runtime event parsing", () => {
  it("emits structured runtime events from NEXU_EVENT log lines", () => {
    const sink = createEventSink();
    const manager = new OpenClawProcessManager(createTestEnv());
    manager.onRuntimeEvent((event) => {
      sink.emitRuntimeEvent(event);
    });

    emitRuntimeEventFromLine(
      manager,
      '2026-04-03T16:48:52.563+08:00 [feishu] NEXU_EVENT channel.reply_outcome {"channel":"feishu","status":"failed","accountId":"acc-1","chatId":"oc_123","sessionKey":"sess-1","messageId":"feishu:run-1","actionId":"feishu:run-1","reasonCode":"provider_error"}',
    );

    expect(sink.events).toHaveLength(1);
    expect(sink.events[0]).toEqual({
      event: "channel.reply_outcome",
      payload: {
        channel: "feishu",
        status: "failed",
        accountId: "acc-1",
        chatId: "oc_123",
        sessionKey: "sess-1",
        messageId: "feishu:run-1",
        actionId: "feishu:run-1",
        reasonCode: "provider_error",
      },
    });
  });

  it("ignores non-marker lines and malformed event payloads", () => {
    const sink = createEventSink();
    const manager = new OpenClawProcessManager(createTestEnv());
    manager.onRuntimeEvent((event) => {
      sink.emitRuntimeEvent(event);
    });

    emitRuntimeEventFromLine(
      manager,
      "2026-04-03T16:48:54.563+08:00 [openclaw] some unrelated error happened",
    );
    emitRuntimeEventFromLine(
      manager,
      '2026-04-03T16:48:55.563+08:00 [openclaw] NEXU_EVENT channel.reply_outcome {"channel":"feishu"',
    );

    expect(sink.events).toHaveLength(0);
  });
});
