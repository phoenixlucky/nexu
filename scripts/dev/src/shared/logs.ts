import { readFile } from "node:fs/promises";

export const defaultLogTailLineCount = 200;

export type DevLogTail = {
  content: string;
  logFilePath: string;
  totalLineCount: number;
};

function normalizeLogLines(content: string): string[] {
  const lines = content.split(/\r?\n/);

  if (lines.at(-1) === "") {
    lines.pop();
  }

  return lines;
}

export function renderLogTail(
  lines: string[],
  maxLines = defaultLogTailLineCount,
): string {
  if (lines.length === 0) {
    return "";
  }

  return `${lines.slice(-maxLines).join("\n")}\n`;
}

export async function readLogTailFromFile(
  logFilePath: string,
  maxLines = defaultLogTailLineCount,
): Promise<DevLogTail> {
  const content = await readFile(logFilePath, "utf8");
  const lines = normalizeLogLines(content);

  return {
    content: renderLogTail(lines, maxLines),
    logFilePath,
    totalLineCount: lines.length,
  };
}

export async function readDesktopSessionLogTailFromFile(options: {
  launchId: string;
  logFilePath: string;
  maxLines?: number;
}): Promise<DevLogTail> {
  const content = await readFile(options.logFilePath, "utf8");
  const lines = normalizeLogLines(content);
  const launchMarker = `start_session launchId=${options.launchId}`;
  let launchLineIndex = -1;

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (lines[index]?.includes(launchMarker)) {
      launchLineIndex = index;
      break;
    }
  }

  if (launchLineIndex < 0) {
    throw new Error(
      `desktop session logs are unavailable for launch id: ${options.launchId}`,
    );
  }

  let sessionStartIndex = launchLineIndex;

  for (let index = launchLineIndex; index >= 0; index -= 1) {
    if (lines[index]?.includes("phase:start start")) {
      sessionStartIndex = index;
      break;
    }
  }

  const sessionLines = lines.slice(sessionStartIndex);

  return {
    content: renderLogTail(sessionLines, options.maxLines),
    logFilePath: options.logFilePath,
    totalLineCount: sessionLines.length,
  };
}
