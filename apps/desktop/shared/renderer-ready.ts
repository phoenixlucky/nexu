const DEFAULT_READY_ATTEMPTS = 50;
const DEFAULT_READY_INTERVAL_MS = 200;

export async function waitForDesktopRendererReady(
  url: string,
  options?: {
    attempts?: number;
    intervalMs?: number;
    fetchImpl?: typeof fetch;
  },
): Promise<void> {
  const attempts = options?.attempts ?? DEFAULT_READY_ATTEMPTS;
  const intervalMs = options?.intervalMs ?? DEFAULT_READY_INTERVAL_MS;
  const fetchImpl = options?.fetchImpl ?? fetch;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        method: "GET",
        headers: { Accept: "text/html" },
      });

      if (response.ok) {
        return;
      }
    } catch {
      // Retry until the sidecar is reachable.
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Desktop renderer did not become ready at ${url}.`);
}
