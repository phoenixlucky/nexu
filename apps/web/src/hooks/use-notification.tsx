import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type NotificationType = "info" | "success" | "warning" | "error";
export type NotificationTransitionState = "entering" | "visible" | "exiting";

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  description?: string;
  duration?: number;
}

export interface NotificationItem extends NotificationPayload {
  id: string;
  state: NotificationTransitionState;
}

interface NotificationOptions {
  duration?: number;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  notify: (payload: NotificationPayload) => string;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
  info: (
    title: string,
    description?: string,
    options?: NotificationOptions,
  ) => string;
  success: (
    title: string,
    description?: string,
    options?: NotificationOptions,
  ) => string;
  warning: (
    title: string,
    description?: string,
    options?: NotificationOptions,
  ) => string;
  error: (
    title: string,
    description?: string,
    options?: NotificationOptions,
  ) => string;
}

const DEFAULT_DURATION_MS = 5000;
const TRANSITION_DURATION_MS = 220;
const ENTRANCE_DELAY_MS = 20;

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

function createNotificationId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function clearTimer(timerMap: Map<string, number>, id: string): void {
  const timer = timerMap.get(id);
  if (timer === undefined) {
    return;
  }

  window.clearTimeout(timer);
  timerMap.delete(id);
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const autoDismissTimersRef = useRef(new Map<string, number>());
  const removalTimersRef = useRef(new Map<string, number>());
  const entranceTimersRef = useRef(new Map<string, number>());

  const dismissNotification = useCallback((id: string) => {
    clearTimer(autoDismissTimersRef.current, id);
    clearTimer(entranceTimersRef.current, id);
    clearTimer(removalTimersRef.current, id);

    setNotifications((prev) =>
      prev.map((item) => {
        if (item.id !== id || item.state === "exiting") {
          return item;
        }
        return { ...item, state: "exiting" };
      }),
    );

    const removalTimer = window.setTimeout(() => {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
      clearTimer(removalTimersRef.current, id);
      clearTimer(autoDismissTimersRef.current, id);
      clearTimer(entranceTimersRef.current, id);
    }, TRANSITION_DURATION_MS);

    removalTimersRef.current.set(id, removalTimer);
  }, []);

  const notify = useCallback(
    (payload: NotificationPayload) => {
      const id = createNotificationId();
      const nextItem: NotificationItem = {
        id,
        type: payload.type,
        title: payload.title,
        description: payload.description,
        duration: payload.duration,
        state: "entering",
      };

      setNotifications((prev) => [nextItem, ...prev]);

      const entranceTimer = window.setTimeout(() => {
        setNotifications((prev) =>
          prev.map((item) => {
            if (item.id !== id || item.state !== "entering") {
              return item;
            }
            return { ...item, state: "visible" };
          }),
        );
        clearTimer(entranceTimersRef.current, id);
      }, ENTRANCE_DELAY_MS);
      entranceTimersRef.current.set(id, entranceTimer);

      const duration = payload.duration ?? DEFAULT_DURATION_MS;
      if (duration > 0) {
        const autoDismissTimer = window.setTimeout(() => {
          dismissNotification(id);
        }, duration);
        autoDismissTimersRef.current.set(id, autoDismissTimer);
      }

      return id;
    },
    [dismissNotification],
  );

  const clearNotifications = useCallback(() => {
    for (const item of notifications) {
      dismissNotification(item.id);
    }
  }, [dismissNotification, notifications]);

  const info = useCallback(
    (title: string, description?: string, options?: NotificationOptions) =>
      notify({
        type: "info",
        title,
        description,
        duration: options?.duration,
      }),
    [notify],
  );

  const success = useCallback(
    (title: string, description?: string, options?: NotificationOptions) =>
      notify({
        type: "success",
        title,
        description,
        duration: options?.duration,
      }),
    [notify],
  );

  const warning = useCallback(
    (title: string, description?: string, options?: NotificationOptions) =>
      notify({
        type: "warning",
        title,
        description,
        duration: options?.duration,
      }),
    [notify],
  );

  const error = useCallback(
    (title: string, description?: string, options?: NotificationOptions) =>
      notify({
        type: "error",
        title,
        description,
        duration: options?.duration,
      }),
    [notify],
  );

  useEffect(() => {
    return () => {
      for (const timer of autoDismissTimersRef.current.values()) {
        window.clearTimeout(timer);
      }
      for (const timer of removalTimersRef.current.values()) {
        window.clearTimeout(timer);
      }
      for (const timer of entranceTimersRef.current.values()) {
        window.clearTimeout(timer);
      }
      autoDismissTimersRef.current.clear();
      removalTimersRef.current.clear();
      entranceTimersRef.current.clear();
    };
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      notify,
      dismissNotification,
      clearNotifications,
      info,
      success,
      warning,
      error,
    }),
    [
      notifications,
      notify,
      dismissNotification,
      clearNotifications,
      info,
      success,
      warning,
      error,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
}
