import { randomUUID } from "node:crypto";
import { logger } from "../lib/logger.js";
import type { OpenClawRuntimeEvent } from "../runtime/openclaw-process.js";
import type {
  SendChannelMessageInput,
  SendChannelMessageResult,
} from "./openclaw-gateway-service.js";

const MAX_RECENT_EVENTS = 100;
const CLAIM_TTL_MS = 10 * 60 * 1000;
const DEFAULT_FALLBACK_MESSAGE =
  "Sorry, I hit an internal error while replying. Please try again in a moment.";

export interface ReplyOutcomeRuntimeEvent {
  event: "channel.reply_outcome";
  payload?: unknown;
}

export interface ChannelReplyOutcomePayload {
  channel: string;
  status: string;
  reasonCode?: string;
  accountId?: string;
  to?: string;
  chatId?: string;
  threadId?: string;
  replyToMessageId?: string;
  sessionKey?: string;
  actionId?: string;
  turnId?: string;
  messageId?: string;
  error?: string;
  ts?: string;
}

export interface ChannelFallbackDiagnosticEntry {
  id: string;
  receivedAt: string;
  channel: string;
  status: string;
  reasonCode: string | null;
  accountId: string | null;
  to: string | null;
  threadId: string | null;
  sessionKey: string | null;
  actionId: string | null;
  fallbackOutcome: "sent" | "skipped" | "failed";
  fallbackReason: string;
  error: string | null;
  sendResult: SendChannelMessageResult | null;
}

export interface ChannelFallbackEventSource {
  onRuntimeEvent(listener: (event: OpenClawRuntimeEvent) => void): () => void;
}

export interface ChannelFallbackMessageSender {
  sendChannelMessage(
    input: SendChannelMessageInput,
  ): Promise<SendChannelMessageResult>;
}

export class ChannelFallbackService {
  private unsubscribe: (() => void) | null = null;
  private readonly recentEvents: ChannelFallbackDiagnosticEntry[] = [];
  private readonly claimedKeys = new Map<string, number>();

  constructor(
    private readonly eventSource: ChannelFallbackEventSource,
    private readonly messageSender: ChannelFallbackMessageSender,
  ) {}

  start(): void {
    if (this.unsubscribe) {
      return;
    }

    this.unsubscribe = this.eventSource.onRuntimeEvent((event) => {
      if (event.event !== "channel.reply_outcome") {
        return;
      }
      void this.handleReplyOutcome(event as ReplyOutcomeRuntimeEvent);
    });
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  listRecentEvents(limit = 20): ChannelFallbackDiagnosticEntry[] {
    const normalizedLimit = Math.max(1, Math.min(limit, MAX_RECENT_EVENTS));
    return this.recentEvents.slice(-normalizedLimit).reverse();
  }

  private async handleReplyOutcome(
    event: ReplyOutcomeRuntimeEvent,
  ): Promise<void> {
    const payload = this.normalizePayload(event.payload);
    if (!payload) {
      this.remember({
        id: randomUUID(),
        receivedAt: new Date().toISOString(),
        channel: "unknown",
        status: "invalid",
        reasonCode: null,
        accountId: null,
        to: null,
        threadId: null,
        sessionKey: null,
        actionId: null,
        fallbackOutcome: "skipped",
        fallbackReason: "invalid_payload",
        error: null,
        sendResult: null,
      });
      return;
    }

    const receivedAt = payload.ts ?? new Date().toISOString();
    const target = payload.to ?? this.chatIdToTarget(payload.chatId);
    const effectiveThreadId =
      payload.replyToMessageId ?? payload.threadId ?? null;
    const baseEntry = {
      id: randomUUID(),
      receivedAt,
      channel: payload.channel,
      status: payload.status,
      reasonCode: payload.reasonCode ?? null,
      accountId: payload.accountId ?? null,
      to: target,
      threadId: effectiveThreadId,
      sessionKey: payload.sessionKey ?? null,
      actionId:
        payload.actionId ??
        payload.turnId ??
        payload.messageId ??
        payload.sessionKey ??
        null,
    } satisfies Omit<
      ChannelFallbackDiagnosticEntry,
      "fallbackOutcome" | "fallbackReason" | "error" | "sendResult"
    >;

    if (!this.shouldHandle(payload)) {
      this.remember({
        ...baseEntry,
        fallbackOutcome: "skipped",
        fallbackReason: "ignored_event",
        error: null,
        sendResult: null,
      });
      return;
    }

    if (!target) {
      this.remember({
        ...baseEntry,
        fallbackOutcome: "skipped",
        fallbackReason: "missing_target",
        error: null,
        sendResult: null,
      });
      return;
    }

    const claimKey = this.buildClaimKey(payload, target);
    if (!this.claim(claimKey)) {
      this.remember({
        ...baseEntry,
        fallbackOutcome: "skipped",
        fallbackReason: "duplicate_claim",
        error: null,
        sendResult: null,
      });
      return;
    }

    try {
      const sendResult = await this.messageSender.sendChannelMessage({
        channel: payload.channel,
        accountId: payload.accountId,
        to: target,
        threadId: effectiveThreadId ?? undefined,
        sessionKey: payload.sessionKey,
        message: this.resolveFallbackMessage(payload),
        idempotencyKey: `fallback:${claimKey}`,
      });

      logger.info(
        {
          channel: payload.channel,
          accountId: payload.accountId ?? null,
          to: target,
          actionId: payload.actionId ?? payload.turnId ?? null,
          reasonCode: payload.reasonCode ?? null,
          messageId: sendResult.messageId ?? null,
        },
        "channel_fallback_sent",
      );

      this.remember({
        ...baseEntry,
        fallbackOutcome: "sent",
        fallbackReason: "fallback_sent",
        error: null,
        sendResult,
      });
    } catch (error) {
      this.claimedKeys.delete(claimKey);
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(
        {
          channel: payload.channel,
          accountId: payload.accountId ?? null,
          to: target,
          actionId: payload.actionId ?? payload.turnId ?? null,
          reasonCode: payload.reasonCode ?? null,
          error: message,
        },
        "channel_fallback_send_failed",
      );
      this.remember({
        ...baseEntry,
        fallbackOutcome: "failed",
        fallbackReason: "send_failed",
        error: message,
        sendResult: null,
      });
    }
  }

  private shouldHandle(payload: ChannelReplyOutcomePayload): boolean {
    if (payload.channel !== "feishu") {
      return false;
    }
    return payload.status === "failed" || payload.status === "silent";
  }

  private normalizePayload(raw: unknown): ChannelReplyOutcomePayload | null {
    if (!raw || typeof raw !== "object") {
      return null;
    }
    const value = raw as Record<string, unknown>;
    const channel = this.asString(value.channel);
    const status = this.asString(value.status);
    if (!channel || !status) {
      return null;
    }
    return {
      channel,
      status,
      reasonCode: this.asString(value.reasonCode) ?? undefined,
      accountId: this.asString(value.accountId) ?? undefined,
      to: this.asString(value.to) ?? undefined,
      chatId: this.asString(value.chatId) ?? undefined,
      threadId: this.asString(value.threadId) ?? undefined,
      replyToMessageId: this.asString(value.replyToMessageId) ?? undefined,
      sessionKey: this.asString(value.sessionKey) ?? undefined,
      actionId: this.asString(value.actionId) ?? undefined,
      turnId: this.asString(value.turnId) ?? undefined,
      messageId: this.asString(value.messageId) ?? undefined,
      error: this.asString(value.error) ?? undefined,
      ts: this.asString(value.ts) ?? undefined,
    };
  }

  private asString(value: unknown): string | null {
    if (typeof value !== "string") {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private chatIdToTarget(chatId?: string): string | null {
    if (!chatId) {
      return null;
    }
    return `chat:${chatId}`;
  }

  private buildClaimKey(
    payload: ChannelReplyOutcomePayload,
    target: string,
  ): string {
    return [
      payload.channel,
      payload.accountId ?? "default",
      payload.actionId ??
        payload.turnId ??
        payload.messageId ??
        payload.sessionKey ??
        "unknown",
      target,
      payload.reasonCode ?? payload.status,
    ].join(":");
  }

  private claim(key: string): boolean {
    const now = Date.now();
    for (const [entryKey, claimedAt] of this.claimedKeys) {
      if (now - claimedAt > CLAIM_TTL_MS) {
        this.claimedKeys.delete(entryKey);
      }
    }
    if (this.claimedKeys.has(key)) {
      return false;
    }
    this.claimedKeys.set(key, now);
    return true;
  }

  private resolveFallbackMessage(_payload: ChannelReplyOutcomePayload): string {
    return DEFAULT_FALLBACK_MESSAGE;
  }

  private remember(entry: ChannelFallbackDiagnosticEntry): void {
    this.recentEvents.push(entry);
    if (this.recentEvents.length > MAX_RECENT_EVENTS) {
      this.recentEvents.splice(0, this.recentEvents.length - MAX_RECENT_EVENTS);
    }
  }
}
