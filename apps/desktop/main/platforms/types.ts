import type { App } from "electron";
import type { DesktopRuntimeConfig } from "../../shared/runtime-config";
import type { DesktopDiagnosticsReporter } from "../desktop-diagnostics";
import type { RuntimeOrchestrator } from "../runtime/daemon-supervisor";
import type { PortAllocation } from "../runtime/port-allocation";
import type { LaunchdBootstrapResult } from "../services";

export type RuntimeConfigPreparation = {
  allocations: PortAllocation[];
  runtimeConfig: DesktopRuntimeConfig;
};

export type PlatformColdStartResult = {
  launchdResult: LaunchdBootstrapResult | null;
};

export type PrepareRuntimeConfigArgs = {
  baseRuntimeConfig: DesktopRuntimeConfig;
  env: NodeJS.ProcessEnv;
  logStartupStep: (message: string) => void;
};

export type RunPlatformColdStartArgs = {
  app: App;
  electronRoot: string;
  runtimeConfig: DesktopRuntimeConfig;
  orchestrator: RuntimeOrchestrator;
  diagnosticsReporter: DesktopDiagnosticsReporter | null;
  logColdStart: (message: string) => void;
  logStartupStep: (message: string) => void;
  rotateDesktopLogSession: () => string;
  waitForControllerReadiness: () => Promise<void>;
};

export type DesktopRuntimePlatformAdapter = {
  id: "mac" | "win" | "default";
  mode: "managed" | "launchd";
  prepareRuntimeConfig: (
    args: PrepareRuntimeConfigArgs,
  ) => Promise<RuntimeConfigPreparation>;
  runColdStart: (
    args: RunPlatformColdStartArgs,
  ) => Promise<PlatformColdStartResult>;
};
