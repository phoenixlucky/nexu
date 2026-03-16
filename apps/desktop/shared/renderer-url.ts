import { getDesktopRuntimeConfig } from "./runtime-config";

export function normalizeDesktopRendererUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export function resolveDesktopRendererUrl(
  env: Record<string, string | undefined>,
): string {
  return normalizeDesktopRendererUrl(getDesktopRuntimeConfig(env).webUrl);
}
