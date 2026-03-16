import { ProviderLogo } from "@/components/provider-logo";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Cpu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Sparkles,
  Unlink,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "@/lib/api";
import {
  getApiV1Channels,
  getApiV1Models,
} from "../../lib/api/sdk.gen";

// ── Typing text animation ─────────────────────────────────────

const WELCOME_MESSAGE_TPL = (channelName: string) =>
  `Welcome! We're so glad you're here. Your setup is complete — click "Chat in ${channelName}" on the right to start chatting with nexu. We're here whenever you need us.`;

function TypingText({ message }: { message: string }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
  }, [message]);

  useEffect(() => {
    if (displayed.length >= message.length) return;
    const timer = setTimeout(() => {
      setDisplayed(message.slice(0, displayed.length + 1));
    }, 25);
    return () => clearTimeout(timer);
  }, [displayed, message]);

  const done = displayed.length >= message.length;

  return (
    <p className="text-[12px] text-text-muted leading-relaxed max-w-lg">
      {displayed}
      {!done && (
        <span className="inline-block w-0.5 h-3.5 ml-0.5 bg-accent animate-pulse align-middle" />
      )}
    </p>
  );
}

// ── Channel icons ─────────────────────────────────────────────

function FeishuIcon({
  size = 20,
  light,
}: {
  size?: number;
  light?: boolean;
}) {
  return (
    <img
      src="/feishu-logo.png"
      width={size}
      height={size}
      alt="飞书"
      style={{
        objectFit: "contain",
        ...(light ? { filter: "brightness(0) invert(1)" } : {}),
      }}
    />
  );
}

const ONBOARDING_CHANNELS = [
  {
    id: "feishu",
    name: "飞书 / Feishu",
    shortName: "飞书",
    icon: FeishuIcon,
    recommended: true,
    chatUrl: "https://www.feishu.cn/",
  },
  {
    id: "slack",
    name: "Slack",
    shortName: "Slack",
    icon: ({ size = 20 }: { size?: number }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <title>Slack</title>
        <path
          d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"
          fill="#E01E5A"
        />
        <path
          d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.527 2.527 0 0 1 2.521 2.521 2.527 2.527 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"
          fill="#36C5F0"
        />
        <path
          d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.163 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"
          fill="#2EB67D"
        />
        <path
          d="M15.163 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.163 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 0 1-2.52-2.523 2.527 2.527 0 0 1 2.52-2.52h6.315A2.528 2.528 0 0 1 24 15.163a2.528 2.528 0 0 1-2.522 2.523h-6.315z"
          fill="#ECB22E"
        />
      </svg>
    ),
    chatUrl: "https://slack.com/",
  },
  {
    id: "discord",
    name: "Discord",
    shortName: "Discord",
    icon: ({ size = 20 }: { size?: number }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#5865F2">
        <title>Discord</title>
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
    chatUrl: "https://discord.com/",
  },
];

// ── Bot manager tabs ──────────────────────────────────────────

type BotManagerTab = "channels" | "models";

const BOT_MANAGER_TABS: {
  id: BotManagerTab;
  label: string;
  icon: typeof MessageSquare;
}[] = [
  { id: "channels", label: "渠道", icon: MessageSquare },
  { id: "models", label: "模型 & Key", icon: Cpu },
];

const GITHUB_URL = "https://github.com/refly-ai/nexu";

// ── Home page ─────────────────────────────────────────────────

export function HomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Data
  const { data: channelsData } = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const { data } = await getApiV1Channels();
      return data;
    },
  });
  const { data: defaultModelData } = useQuery({
    queryKey: ["desktop-default-model"],
    queryFn: async () => {
      const res = await fetch("/api/internal/desktop/default-model");
      return (await res.json()) as { modelId: string | null };
    },
  });
  const { data: modelsData } = useQuery({
    queryKey: ["models"],
    queryFn: async () => {
      const { data } = await getApiV1Models();
      return data;
    },
  });

  const channels = channelsData?.channels ?? [];
  const connectedCount = channels.length;
  const connectedChannel = useMemo(() => {
    if (channels.length === 0) return null;
    const ch = channels[0];
    if (!ch) return null;
    const chType = ch.channelType ?? "feishu";
    const def = ONBOARDING_CHANNELS.find((o) => o.id === chType);
    return def
      ? { ...def, chatUrl: def.chatUrl }
      : { id: chType, shortName: chType, icon: FeishuIcon, chatUrl: "#" };
  }, [channels]);

  const models = modelsData?.models ?? [];
  const currentModelId = defaultModelData?.modelId ?? "";
  const currentModelName =
    models.find((m) => m.id === currentModelId)?.name ?? currentModelId;

  // Group models by provider (link/* models → "Nexu Official")
  const modelsByProvider = useMemo(() => {
    const map = new Map<string, typeof models>();
    for (const m of models) {
      const groupKey = m.id.startsWith("link/") ? "nexu" : m.provider;
      const list = map.get(groupKey) ?? [];
      list.push(m);
      map.set(groupKey, list);
    }
    const PROVIDER_LABELS: Record<string, string> = {
      nexu: "Nexu Official",
      anthropic: "Anthropic",
      openai: "OpenAI",
      google: "Google",
    };
    // Put Nexu Official first
    const entries = Array.from(map.entries());
    entries.sort((a, b) => {
      if (a[0] === "nexu") return -1;
      if (b[0] === "nexu") return 1;
      return 0;
    });
    return entries.map(([provider, ms]) => ({
      id: provider,
      name: PROVIDER_LABELS[provider] ?? provider,
      models: ms,
    }));
  }, [models]);

  // UI state
  const [showConfig, setShowConfig] = useState(false);
  const [botManagerTab, setBotManagerTab] = useState<BotManagerTab>("channels");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(
    new Set(),
  );
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // Close model dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(e.target as Node)
      ) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Expand current model's provider on open
  useEffect(() => {
    if (showModelDropdown) {
      const currentProvider = models.find(
        (m) => m.id === currentModelId,
      )?.provider;
      setExpandedProviders(
        new Set(
          currentProvider
            ? [currentProvider]
            : modelsByProvider.length > 0 && modelsByProvider[0]
              ? [modelsByProvider[0].id]
              : [],
        ),
      );
    }
  }, [showModelDropdown, currentModelId, models, modelsByProvider]);

  const updateModel = useMutation({
    mutationFn: async (modelId: string) => {
      await fetch("/api/internal/desktop/default-model", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["desktop-default-model"] });
      setShowModelDropdown(false);
    },
  });

  const hasChannel = connectedCount > 0;
  const ChannelIcon = connectedChannel?.icon ?? FeishuIcon;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ── nexu intro card ── */}
        <div className="mb-8 rounded-2xl bg-surface-1 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="px-6 pt-6 pb-5">
            {/* Top: Avatar + Identity + Actions */}
            <div className="flex items-start gap-6">
              {/* Avatar — larger */}
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden bg-surface-2 shrink-0">
                <video
                  ref={videoRef}
                  src="https://static.refly.ai/video/nexu-alpha.mp4"
                  poster="/nexu-alpha-poster.jpg"
                  preload="auto"
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Identity + Status + Actions stacked */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2
                    className="text-[22px] sm:text-[26px] font-normal tracking-tight text-text-primary"
                    style={{ fontFamily: "var(--font-script)" }}
                  >
                    nexu Alpha
                  </h2>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Running
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-text-muted mb-3">
                  <span className="flex items-center gap-1">
                    <Cpu size={10} />
                    {currentModelName || "未选择"}
                  </span>
                  <span className="text-border">&middot;</span>
                  <span>12 messages today</span>
                  <span className="text-border">&middot;</span>
                  <span>Active 2 min ago</span>
                </div>
                <TypingText
                  message={WELCOME_MESSAGE_TPL(
                    connectedChannel?.shortName || "飞书",
                  )}
                />
                {/* Actions below text */}
                <div className="flex items-center gap-2 mt-4">
                  {hasChannel ? (
                    <a
                      href={connectedChannel?.chatUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium bg-accent text-accent-fg hover:bg-accent-hover transition-colors"
                    >
                      <ChannelIcon size={14} light />
                      Chat in {connectedChannel?.shortName || "飞书"}
                      <ArrowUpRight size={12} className="opacity-70" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate("/workspace/channels")}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium bg-accent text-accent-fg hover:bg-accent-hover transition-colors"
                    >
                      连接渠道
                      <ArrowUpRight size={12} className="opacity-70" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfig(!showConfig)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium border border-border text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
                  >
                    <Settings size={13} />
                    更改配置
                    <ChevronDown
                      size={12}
                      className={`transition-transform ${showConfig ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Config panel (expand) ── */}
            {showConfig && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-3">
                  {BOT_MANAGER_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const active = botManagerTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setBotManagerTab(tab.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors",
                          active
                            ? "border-accent/20 bg-accent/10 text-accent"
                            : "border-border text-text-muted hover:text-text-primary hover:bg-surface-2",
                        )}
                      >
                        <Icon size={12} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Channels tab */}
                {botManagerTab === "channels" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {ONBOARDING_CHANNELS.map((ch) => {
                      const Icon = ch.icon;
                      const isConnected = channels.some(
                        (c) => c.channelType === ch.id,
                      );
                      return (
                        <div
                          key={ch.id}
                          className={cn(
                            "rounded-xl border px-3 py-3 transition-all",
                            isConnected
                              ? "border-accent/20 bg-accent/5"
                              : "border-border bg-surface-0",
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-border bg-white shrink-0">
                              <Icon size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[13px] font-medium text-text-primary">
                                {ch.name}
                              </div>
                              <div className="mt-0.5 text-[11px] text-text-muted">
                                {isConnected ? "已连接" : "未连接"}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex justify-end">
                            {isConnected ? (
                              <button
                                type="button"
                                onClick={() =>
                                  navigate("/workspace/channels")
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-red-500 hover:bg-red-500/5 border border-red-500/20 hover:border-red-500/30 transition-colors"
                              >
                                <Unlink size={12} />
                                断开连接
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  navigate("/workspace/channels")
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-border text-text-secondary hover:bg-surface-2 hover:border-border-hover transition-colors"
                              >
                                <Plus size={12} />
                                连接
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Models tab */}
                {botManagerTab === "models" && (
                  <div className="space-y-2">
                    {/* Default model selector */}
                    <div className="relative" ref={modelDropdownRef}>
                      <button
                        type="button"
                        onClick={() =>
                          setShowModelDropdown(!showModelDropdown)
                        }
                        className="w-full flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-0 px-3 py-2 transition-colors hover:border-border-hover"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {currentModelId ? (
                            <span className="w-4 h-4 shrink-0 flex items-center justify-center">
                              <ProviderLogo
                                provider={
                                  models.find(
                                    (m) => m.id === currentModelId,
                                  )?.provider ?? "nexu"
                                }
                                size={14}
                              />
                            </span>
                          ) : (
                            <Cpu
                              size={14}
                              className="text-accent shrink-0"
                            />
                          )}
                          <span className="text-[12px] font-medium text-text-primary truncate">
                            {currentModelName || "未选择"}
                          </span>
                        </div>
                        <ChevronDown
                          size={12}
                          className={cn(
                            "text-text-muted transition-transform shrink-0",
                            showModelDropdown && "rotate-180",
                          )}
                        />
                      </button>

                      {showModelDropdown && (() => {
                        const query = modelSearch.toLowerCase().trim();
                        const filteredProviders = modelsByProvider
                          .map((p) => ({
                            ...p,
                            models: p.models.filter(
                              (m) =>
                                !query ||
                                m.name.toLowerCase().includes(query) ||
                                p.name.toLowerCase().includes(query),
                            ),
                          }))
                          .filter((p) => p.models.length > 0);

                        return (
                          <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-surface-1 shadow-xl">
                            {/* Search */}
                            <div className="px-3 pt-3 pb-2">
                              <div className="flex items-center gap-2.5 rounded-lg bg-surface-0 border border-border px-3 py-2">
                                <Search
                                  size={14}
                                  className="text-text-muted shrink-0"
                                />
                                <input
                                  type="text"
                                  value={modelSearch}
                                  onChange={(e) => {
                                    setModelSearch(e.target.value);
                                    if (e.target.value.trim()) {
                                      setExpandedProviders(
                                        new Set(
                                          modelsByProvider.map(
                                            (p) => p.id,
                                          ),
                                        ),
                                      );
                                    }
                                  }}
                                  placeholder="搜索模型..."
                                  className="flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-muted/50 outline-none"
                                  autoFocus
                                />
                              </div>
                            </div>

                            {/* Provider groups */}
                            <div className="relative">
                              <div className="pointer-events-none absolute inset-x-0 top-0 h-4 z-10 bg-gradient-to-b from-surface-1 to-transparent" />
                              <div
                                className="max-h-[360px] overflow-y-auto py-1"
                                style={{
                                  overscrollBehavior: "contain",
                                  WebkitOverflowScrolling: "touch",
                                }}
                              >
                                {filteredProviders.length === 0 ? (
                                  <div className="px-4 py-8 text-center text-[13px] text-text-muted">
                                    无匹配模型
                                  </div>
                                ) : (
                                  filteredProviders.map((provider) => {
                                    const isExpanded =
                                      expandedProviders.has(
                                        provider.id,
                                      ) || !!query;
                                    return (
                                      <div key={provider.id}>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (query) return;
                                            setExpandedProviders(
                                              (prev) => {
                                                const next = new Set(
                                                  prev,
                                                );
                                                if (
                                                  next.has(provider.id)
                                                )
                                                  next.delete(
                                                    provider.id,
                                                  );
                                                else
                                                  next.add(provider.id);
                                                return next;
                                              },
                                            );
                                          }}
                                          className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-surface-2/50 transition-colors"
                                        >
                                          <ChevronDown
                                            size={11}
                                            className={cn(
                                              "text-text-muted/50 transition-transform",
                                              !isExpanded && "-rotate-90",
                                            )}
                                          />
                                          <span className="w-[18px] h-[18px] shrink-0 flex items-center justify-center">
                                            <ProviderLogo
                                              provider={provider.id}
                                              size={15}
                                            />
                                          </span>
                                          <span className="text-[12px] font-medium text-text-secondary">
                                            {provider.name}
                                          </span>
                                          <span className="text-[11px] text-text-muted/40 ml-auto tabular-nums">
                                            {provider.models.length}
                                          </span>
                                        </button>
                                        {isExpanded &&
                                          provider.models.map(
                                            (model) => (
                                              <button
                                                key={model.id}
                                                type="button"
                                                onClick={() =>
                                                  updateModel.mutate(
                                                    model.id,
                                                  )
                                                }
                                                className={cn(
                                                  "w-full flex items-center gap-2.5 pl-9 pr-3 py-2 text-left transition-colors hover:bg-surface-2",
                                                  model.id ===
                                                    currentModelId &&
                                                    "bg-accent/5",
                                                )}
                                              >
                                                {model.id ===
                                                currentModelId ? (
                                                  <Check
                                                    size={13}
                                                    className="text-accent shrink-0"
                                                  />
                                                ) : (
                                                  <span className="w-[13px] shrink-0" />
                                                )}
                                                <span className="text-[13px] font-medium text-text-primary truncate flex-1">
                                                  {model.name}
                                                </span>
                                              </button>
                                            ),
                                          )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 z-10 bg-gradient-to-t from-surface-1 to-transparent" />
                            </div>

                            {/* Footer: settings shortcut */}
                            <div className="border-t border-border px-2 py-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowModelDropdown(false);
                                  navigate("/workspace/models");
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors hover:bg-surface-2"
                              >
                                <Settings
                                  size={13}
                                  className="text-text-muted"
                                />
                                <span className="text-[12px] text-text-muted">
                                  配置 AI 服务商
                                </span>
                                <ArrowRight
                                  size={11}
                                  className="text-text-muted/50 ml-auto"
                                />
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Action cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-7">
          <button
            type="button"
            onClick={() => navigate("/workspace/channels")}
            className="group rounded-xl border border-border bg-surface-1 px-4 py-3.5 text-left transition-all hover:bg-surface-2 hover:border-border-hover active:scale-[0.98]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-accent/8 flex items-center justify-center shrink-0">
                  <MessageSquare size={13} className="text-accent" />
                </div>
                <div className="text-[14px] font-semibold text-text-primary truncate">
                  View conversations
                </div>
              </div>
              <ArrowUpRight
                size={10}
                className="text-text-muted/45 group-hover:text-accent transition-colors shrink-0"
              />
            </div>
            <div className="mt-1.5 text-[9px] leading-[1.4] text-text-muted/85">
              Threads and channel activity
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/workspace/models")}
            className="group rounded-xl border border-border bg-surface-1 px-4 py-3.5 text-left transition-all hover:bg-surface-2 hover:border-border-hover active:scale-[0.98]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-accent/8 flex items-center justify-center shrink-0">
                  <Sparkles size={13} className="text-accent" />
                </div>
                <div className="text-[14px] font-semibold text-text-primary truncate">
                  Manage skills
                </div>
              </div>
              <ArrowUpRight
                size={10}
                className="text-text-muted/45 group-hover:text-accent transition-colors shrink-0"
              />
            </div>
            <div className="mt-1.5 text-[9px] leading-[1.4] text-text-muted/85">
              Tools and capabilities
            </div>
          </button>

          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl border border-border bg-surface-1 px-4 py-3.5 text-left transition-all hover:bg-surface-2 hover:border-border-hover active:scale-[0.98]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-[#111]/8 dark:bg-white/8 flex items-center justify-center shrink-0">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="text-text-primary"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </div>
                <div className="text-[14px] font-semibold text-text-primary truncate">
                  Star us on GitHub
                </div>
              </div>
              <ArrowUpRight
                size={10}
                className="text-text-muted/45 group-hover:text-accent transition-colors shrink-0"
              />
            </div>
            <div className="mt-1.5 text-[9px] text-text-muted/85">
              Follow updates, code, and releases
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
