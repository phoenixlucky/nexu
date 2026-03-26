import type { DesktopRuntimePlatformAdapter } from "../types";
import {
  PortAllocationError,
  allocateDesktopRuntimePorts,
} from "../../runtime/port-allocation";

export async function prepareManagedRuntimeConfig(
  adapterId: DesktopRuntimePlatformAdapter["id"],
  {
    baseRuntimeConfig,
    env,
    logStartupStep,
  }: Parameters<DesktopRuntimePlatformAdapter["prepareRuntimeConfig"]>[0],
) {
  logStartupStep(`${adapterId}:prepareRuntimeConfig:start`);
  try {
    const result = await allocateDesktopRuntimePorts(env, baseRuntimeConfig).catch(
      (error: unknown) => {
        if (error instanceof PortAllocationError) {
          throw new Error(
            `[desktop:ports] ${error.code} purpose=${error.purpose} ` +
              `preferredPort=${error.preferredPort ?? "n/a"} ${error.message}`,
          );
        }

        throw error;
      },
    );
    logStartupStep(`${adapterId}:prepareRuntimeConfig:done`);
    return result;
  } catch (error) {
    logStartupStep(
      `${adapterId}:prepareRuntimeConfig:fail ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}

export async function runManagedColdStart({
  diagnosticsReporter,
  logColdStart,
  logStartupStep,
  orchestrator,
  rotateDesktopLogSession,
  waitForControllerReadiness,
}: Parameters<DesktopRuntimePlatformAdapter["runColdStart"]>[0]) {
  logStartupStep("managedColdStart:start");
  diagnosticsReporter?.markColdStartRunning("starting controller");
  logColdStart("starting controller");
  await orchestrator.startOne("controller");

  diagnosticsReporter?.markColdStartRunning("waiting for controller readiness");
  logColdStart("waiting for controller readiness");
  await waitForControllerReadiness();

  diagnosticsReporter?.markColdStartRunning("starting web");
  logColdStart("starting web");
  await orchestrator.startOne("web");

  const sessionId = rotateDesktopLogSession();
  logColdStart(`cold start session ready sessionId=${sessionId}`);
  logColdStart("cold start complete");
  diagnosticsReporter?.markColdStartSucceeded();
  logStartupStep("managedColdStart:done");

  return {
    launchdResult: null,
  };
}

export function createManagedRuntimePlatformAdapter(
  id: DesktopRuntimePlatformAdapter["id"],
): DesktopRuntimePlatformAdapter {
  return {
    id,
    mode: "managed",
    prepareRuntimeConfig: (args) => prepareManagedRuntimeConfig(id, args),
    runColdStart: (args) => runManagedColdStart(args),
  };
}
