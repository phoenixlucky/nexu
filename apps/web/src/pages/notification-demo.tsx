import { Button } from "@/components/ui/button";
import {
  type NotificationType,
  useNotification,
} from "@/hooks/use-notification";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Info,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

const TYPE_ORDER: NotificationType[] = ["info", "success", "warning", "error"];

const NOTIFICATION_DEMO_CONFIG: Record<
  NotificationType,
  {
    title: string;
    description: string;
    icon: LucideIcon;
    buttonClassName: string;
  }
> = {
  info: {
    title: "Information updated",
    description: "Your workspace settings were refreshed successfully.",
    icon: Info,
    buttonClassName:
      "border-blue-500/40 bg-blue-500/10 text-blue-900 hover:bg-blue-500/20",
  },
  success: {
    title: "Saved successfully",
    description: "The bot configuration has been published.",
    icon: CheckCircle2,
    buttonClassName:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 hover:bg-emerald-500/20",
  },
  warning: {
    title: "Rate limit warning",
    description: "Message throughput is close to your current plan limit.",
    icon: AlertTriangle,
    buttonClassName:
      "border-amber-500/40 bg-amber-500/15 text-amber-900 hover:bg-amber-500/25",
  },
  error: {
    title: "Delivery failed",
    description: "Slack webhook temporarily unavailable, retry in a moment.",
    icon: AlertCircle,
    buttonClassName:
      "border-red-500/40 bg-red-500/10 text-red-900 hover:bg-red-500/20",
  },
};

export function NotificationDemoPage() {
  const { info, success, warning, error, notify, clearNotifications } =
    useNotification();
  const stackedTimersRef = useRef<number[]>([]);

  const clearStackedTimers = useCallback(() => {
    for (const timer of stackedTimersRef.current) {
      window.clearTimeout(timer);
    }
    stackedTimersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearStackedTimers();
    };
  }, [clearStackedTimers]);

  const triggerNotification = (type: NotificationType) => {
    const config = NOTIFICATION_DEMO_CONFIG[type];
    notify({
      type,
      title: config.title,
      description: config.description,
      duration: 5500,
    });
  };

  const triggerStackedNotifications = () => {
    clearStackedTimers();

    for (const [index, type] of TYPE_ORDER.entries()) {
      const config = NOTIFICATION_DEMO_CONFIG[type];
      const timer = window.setTimeout(() => {
        notify({
          type,
          title: config.title,
          description: config.description,
          duration: 8000,
        });
      }, index * 180);
      stackedTimersRef.current.push(timer);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl p-4 sm:p-8">
      <div className="rounded-2xl border border-border bg-surface-1 p-5 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <BellRing size={18} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary sm:text-xl">
              Notification Banner Demo
            </h1>
            <p className="text-sm text-text-muted">
              Trigger all banner types, stacked notifications, and dismiss
              behaviors.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {TYPE_ORDER.map((type) => {
            const config = NOTIFICATION_DEMO_CONFIG[type];
            const Icon = config.icon;

            return (
              <button
                key={type}
                type="button"
                onClick={() => triggerNotification(type)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition",
                  config.buttonClassName,
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <div>
                  <div className="text-sm font-semibold capitalize">{type}</div>
                  <div className="text-xs opacity-80">{config.title}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={triggerStackedNotifications}
            className="w-full sm:w-auto"
          >
            Show stacked notifications
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              info(
                "Manual info",
                "You can call info(), success(), warning(), and error() directly.",
                { duration: 6500 },
              )
            }
            className="w-full sm:w-auto"
          >
            Trigger via info()
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              success("Deployment complete", "All services are healthy.", {
                duration: 4500,
              })
            }
            className="w-full sm:w-auto"
          >
            Trigger via success()
          </Button>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              warning("Usage warning", "You are approaching your quota.", {
                duration: 5500,
              })
            }
            className="w-full sm:w-auto"
          >
            Trigger via warning()
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              error("Sync failed", "The request timed out. Please retry.", {
                duration: 7000,
              })
            }
            className="w-full sm:w-auto"
          >
            Trigger via error()
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={clearNotifications}
            className="w-full sm:w-auto"
          >
            Clear all banners
          </Button>
        </div>
      </div>
    </div>
  );
}
