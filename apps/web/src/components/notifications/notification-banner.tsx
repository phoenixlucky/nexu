import {
  type NotificationTransitionState,
  type NotificationType,
  useNotification,
} from "@/hooks/use-notification";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const TYPE_STYLES: Record<
  NotificationType,
  {
    icon: LucideIcon;
    label: string;
    containerClassName: string;
    iconClassName: string;
  }
> = {
  info: {
    icon: Info,
    label: "Info",
    containerClassName:
      "border-blue-500/35 bg-blue-500/10 text-blue-950 shadow-blue-500/10",
    iconClassName: "text-blue-700",
  },
  success: {
    icon: CheckCircle2,
    label: "Success",
    containerClassName:
      "border-emerald-500/35 bg-emerald-500/10 text-emerald-950 shadow-emerald-500/10",
    iconClassName: "text-emerald-700",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    containerClassName:
      "border-amber-500/40 bg-amber-500/15 text-amber-950 shadow-amber-500/10",
    iconClassName: "text-amber-700",
  },
  error: {
    icon: AlertCircle,
    label: "Error",
    containerClassName:
      "border-red-500/35 bg-red-500/10 text-red-950 shadow-red-500/10",
    iconClassName: "text-red-700",
  },
};

const TRANSITION_CLASS_NAMES =
  "transition-[opacity,transform] duration-200 ease-out will-change-transform";

function getAnimationClassName(state: NotificationTransitionState): string {
  if (state === "entering") {
    return "-translate-y-2 opacity-0 scale-[0.98]";
  }
  if (state === "exiting") {
    return "-translate-y-2 opacity-0 scale-[0.98]";
  }
  return "translate-y-0 opacity-100 scale-100";
}

export function NotificationBanner() {
  const { notifications, dismissNotification } = useNotification();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 px-2 pt-2 sm:px-4 sm:pt-4">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
        {notifications.map((notification) => {
          const style = TYPE_STYLES[notification.type];
          const Icon = style.icon;

          return (
            <div
              key={notification.id}
              aria-live="polite"
              className={cn(
                "pointer-events-auto overflow-hidden rounded-xl border backdrop-blur-sm shadow-lg",
                "px-3 py-2.5 sm:px-4 sm:py-3",
                style.containerClassName,
                TRANSITION_CLASS_NAMES,
                getAnimationClassName(notification.state),
              )}
            >
              <div className="flex items-start gap-2.5 sm:gap-3">
                <Icon
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0 sm:h-4.5 sm:w-4.5",
                    style.iconClassName,
                  )}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                      {style.label}
                    </span>
                    <p className="text-sm font-semibold leading-5 break-words">
                      {notification.title}
                    </p>
                  </div>

                  {notification.description ? (
                    <p className="mt-1 text-xs leading-5 opacity-90 sm:text-sm">
                      {notification.description}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => dismissNotification(notification.id)}
                  aria-label="Close notification"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md opacity-80 transition hover:bg-black/5 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
