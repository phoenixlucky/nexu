import { Input } from "@/components/ui/input";
import { identify, track } from "@/lib/tracking";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Loader2,
  Lock,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const FEISHU_SETUP_STEPS = [
  { title: "Create App" },
  { title: "Permissions" },
  { title: "Credentials" },
];

const FEISHU_PERMISSIONS = [
  { scope: "im:message", desc: "Send and receive messages" },
  { scope: "im:chat", desc: "Access chat information" },
  { scope: "contact:user.base:readonly", desc: "Read user info" },
];

const FEISHU_OPTIONAL_PERMISSIONS = [
  { scope: "docx:document", desc: "Read/write documents" },
  { scope: "bitable:bitable", desc: "Manage Bitable databases" },
  { scope: "calendar:calendar", desc: "Manage calendar events" },
  { scope: "task:task", desc: "Manage tasks" },
  { scope: "wiki:wiki:readonly", desc: "Read wiki content" },
];

export interface FeishuSetupViewProps {
  onConnected: () => void;
  variant?: "page" | "modal";
  disabled?: boolean;
}

export function FeishuSetupView({
  onConnected,
  variant = "page",
  disabled,
}: FeishuSetupViewProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await fetch("/api/v1/channels/feishu/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          appId: appId.trim(),
          appSecret: appSecret.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data?.message ?? "Failed to connect Feishu");
        return;
      }
      toast.success("Feishu connected!");
      track("channel_ready", {
        channel: "feishu",
        channel_type: "feishu_app",
      });
      identify({ channels_connected: 1 });
      onConnected();
    } catch {
      toast.error("Failed to connect Feishu");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className={variant === "modal" ? "" : ""}>
      {/* Step indicator */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {FEISHU_SETUP_STEPS.map((s, i) => (
          <button
            type="button"
            key={s.title}
            onClick={() => setActiveStep(i)}
            className="text-left cursor-pointer"
          >
            <div
              className={`h-1 rounded-full transition-all ${
                i <= activeStep ? "bg-blue-500" : "bg-border"
              }`}
            />
            <div
              className={`text-[11px] font-semibold mt-2 transition-all ${
                i === activeStep
                  ? "text-blue-500"
                  : i < activeStep
                    ? "text-text-secondary"
                    : "text-text-muted/50"
              }`}
            >
              Step {i + 1}
            </div>
            <div
              className={`text-[10px] mt-0.5 leading-tight transition-all ${
                i === activeStep ? "text-text-secondary" : "text-text-muted/40"
              }`}
            >
              {s.title}
            </div>
          </button>
        ))}
      </div>

      {/* Step 1: Create App */}
      {activeStep === 0 && (
        <div className="p-5 rounded-xl border bg-surface-1 border-border">
          <div className="flex gap-3 items-start mb-4">
            <div className="flex justify-center items-center w-8 h-8 rounded-lg bg-blue-500/10 text-[12px] font-bold text-blue-500 shrink-0">
              1
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-text-primary">
                Create a Feishu App
              </h3>
              <p className="text-[12px] text-text-muted mt-1 leading-relaxed">
                Go to the Feishu Open Platform and create a self-built
                application.
              </p>
            </div>
          </div>
          <div className="ml-11 space-y-3">
            <div className="space-y-2">
              {[
                "Open Feishu Open Platform (open.feishu.cn)",
                'Click "Create Custom App" (创建企业自建应用)',
                "Fill in app name and description",
                "Enable Bot capability (机器人) in Add Capabilities",
                "Enable WebSocket event callback in Events & Callbacks",
                'Add "Card Action Trigger" callback (卡片回传交互)',
              ].map((item, i) => (
                <div key={item} className="flex gap-2.5 items-start">
                  <div className="flex justify-center items-center w-5 h-5 rounded-full bg-surface-3 text-[9px] font-bold text-text-muted shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <span className="text-[12px] text-text-secondary leading-relaxed">
                    {item}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <a
                href="https://open.feishu.cn/app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex gap-1.5 items-center px-3.5 py-2 text-[12px] font-medium rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-border-hover hover:bg-surface-3 transition-all"
              >
                <ExternalLink size={12} />
                Feishu (China)
              </a>
              <a
                href="https://open.larksuite.com/app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex gap-1.5 items-center px-3.5 py-2 text-[12px] font-medium rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-border-hover hover:bg-surface-3 transition-all"
              >
                <ExternalLink size={12} />
                Lark (International)
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Permissions */}
      {activeStep === 1 && (
        <div className="p-5 rounded-xl border bg-surface-1 border-border">
          <div className="flex gap-3 items-start mb-4">
            <div className="flex justify-center items-center w-8 h-8 rounded-lg bg-blue-500/10 text-[12px] font-bold text-blue-500 shrink-0">
              2
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-text-primary">
                Grant API Permissions
              </h3>
              <p className="text-[12px] text-text-muted mt-1 leading-relaxed">
                Go to{" "}
                <span className="font-medium text-text-secondary">
                  Permissions & Scopes
                </span>{" "}
                (权限管理) and enable the required permissions. Then publish the
                app.
              </p>
            </div>
          </div>
          <div className="ml-11 space-y-4">
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="px-3.5 py-2.5 bg-surface-3 border-b border-border">
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
                  Required Permissions
                </span>
              </div>
              {FEISHU_PERMISSIONS.map((p, i) => (
                <div
                  key={p.scope}
                  className={`flex items-center gap-3 px-3.5 py-2.5 ${
                    i < FEISHU_PERMISSIONS.length - 1
                      ? "border-b border-border"
                      : ""
                  }`}
                >
                  <CheckCircle2
                    size={12}
                    className="text-emerald-500 shrink-0"
                  />
                  <code className="text-[11px] font-mono text-blue-500 bg-blue-500/8 px-1.5 py-0.5 rounded font-medium">
                    {p.scope}
                  </code>
                  <span className="text-[11px] text-text-muted ml-auto">
                    {p.desc}
                  </span>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="px-3.5 py-2.5 bg-surface-3 border-b border-border">
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
                  Optional (for skills)
                </span>
              </div>
              {FEISHU_OPTIONAL_PERMISSIONS.map((p, i) => (
                <div
                  key={p.scope}
                  className={`flex items-center gap-3 px-3.5 py-2.5 ${
                    i < FEISHU_OPTIONAL_PERMISSIONS.length - 1
                      ? "border-b border-border"
                      : ""
                  }`}
                >
                  <CheckCircle2
                    size={12}
                    className="text-text-muted/30 shrink-0"
                  />
                  <code className="text-[11px] font-mono text-text-muted bg-surface-3 px-1.5 py-0.5 rounded font-medium">
                    {p.scope}
                  </code>
                  <span className="text-[11px] text-text-muted ml-auto">
                    {p.desc}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              After granting permissions, create a new version and publish the
              app.
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Credentials */}
      {activeStep === 2 && (
        <div className="p-5 rounded-xl border bg-surface-1 border-border">
          <div className="flex gap-3 items-start mb-4">
            <div className="flex justify-center items-center w-8 h-8 rounded-lg bg-blue-500/10 text-[12px] font-bold text-blue-500 shrink-0">
              3
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-text-primary">
                Enter Credentials
              </h3>
              <p className="text-[12px] text-text-muted mt-1 leading-relaxed">
                Find your App ID and App Secret on the{" "}
                <span className="font-medium text-text-secondary">
                  Credentials & Basic Info
                </span>{" "}
                (凭证与基础信息) page of your app.
              </p>
            </div>
          </div>
          <div className="ml-11 space-y-4">
            <div>
              <div className="flex items-baseline gap-1.5 mb-1.5">
                <label
                  htmlFor="feishu-app-id"
                  className="text-[12px] text-text-primary font-medium"
                >
                  App ID
                </label>
                <span className="text-[11px] text-text-muted">
                  — found in Credentials & Basic Info
                </span>
              </div>
              <Input
                id="feishu-app-id"
                type="text"
                placeholder="e.g. cli_xxxxxxxxxx"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="text-[13px] font-mono"
              />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 mb-1.5">
                <label
                  htmlFor="feishu-app-secret"
                  className="text-[12px] text-text-primary font-medium"
                >
                  App Secret
                </label>
                <span className="text-[11px] text-text-muted">
                  — found in Credentials & Basic Info
                </span>
              </div>
              <div className="relative">
                <Input
                  id="feishu-app-secret"
                  type="password"
                  placeholder="e.g. xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  className="text-[13px] font-mono pr-9"
                />
                <Lock
                  size={13}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted/40"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleConnect}
              disabled={
                disabled || connecting || !appId.trim() || !appSecret.trim()
              }
              className="flex gap-1.5 items-center px-5 py-2.5 text-[13px] font-medium text-white rounded-lg bg-blue-500 hover:bg-blue-600 transition-all disabled:opacity-60 cursor-pointer"
            >
              {connecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check size={14} />
              )}
              Verify & Connect
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center mt-5">
        <button
          type="button"
          onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
          disabled={activeStep === 0}
          className="flex gap-1.5 items-center text-[12px] text-text-muted hover:text-text-secondary transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ArrowLeft size={13} />
          Previous
        </button>
        {activeStep < FEISHU_SETUP_STEPS.length - 1 && (
          <button
            type="button"
            onClick={() => setActiveStep(activeStep + 1)}
            className="flex gap-1.5 items-center px-4 py-2 text-[12px] font-medium text-white rounded-lg bg-blue-500 hover:bg-blue-600 transition-all cursor-pointer"
          >
            Next
            <ChevronRight size={13} />
          </button>
        )}
      </div>

      {/* Help link */}
      <div className="flex gap-3 items-center p-4 mt-5 rounded-xl border bg-surface-1 border-border">
        <BookOpen size={14} className="text-blue-500 shrink-0" />
        <p className="text-[11px] text-text-muted leading-relaxed">
          Need help? Read the{" "}
          <a
            href="https://open.feishu.cn/document/home/introduction-to-custom-app-development/self-built-application-development-process"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline underline-offset-2 font-medium"
          >
            Feishu App Development Guide
          </a>{" "}
          for detailed instructions.
        </p>
      </div>
    </div>
  );
}
