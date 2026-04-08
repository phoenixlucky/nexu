function readMessage(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = (value as { message?: unknown }).message;
  return typeof candidate === "string" && candidate.trim().length > 0
    ? candidate
    : null;
}

export function getRewardErrorMessage(error: unknown): string | null {
  const directMessage = readMessage(error);
  if (directMessage) {
    return directMessage;
  }

  if (!error || typeof error !== "object") {
    return null;
  }

  const nestedError = (error as { error?: unknown }).error;
  return readMessage(nestedError);
}
