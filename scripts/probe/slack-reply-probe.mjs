import { existsSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const scriptFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptFilePath), "../..");
const defaultProfileDir = path.join(
  repoRoot,
  ".tmp",
  "slack-reply-probe",
  "chrome-profile",
);
const defaultSlackUrl =
  process.env.SLACK_PROBE_URL ??
  "https://app.slack.com/client/T09CNAG1BP0/C0AMG3SDUES";
const defaultTimeoutMs = Number(process.env.SLACK_PROBE_TIMEOUT_MS ?? "15000");
const defaultPrepareTimeoutMs = Number(
  process.env.SLACK_PROBE_PREPARE_TIMEOUT_MS ?? "600000",
);
const browserChannel = process.env.SLACK_PROBE_BROWSER_CHANNEL ?? "chrome";

function parseArgs(argv) {
  const options = {
    mode: "open",
    profileDir: defaultProfileDir,
    slackUrl: defaultSlackUrl,
    headless: false,
    resetProfile: false,
    timeoutMs: defaultTimeoutMs,
    prepareTimeoutMs: defaultPrepareTimeoutMs,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--headless") {
      options.headless = true;
      continue;
    }
    if (arg === "--reset-profile") {
      options.resetProfile = true;
      continue;
    }
    if (arg === "--profile-dir") {
      options.profileDir = path.resolve(argv[index + 1] ?? options.profileDir);
      index += 1;
      continue;
    }
    if (arg === "--url") {
      options.slackUrl = argv[index + 1] ?? options.slackUrl;
      index += 1;
      continue;
    }
    if (arg === "--timeout-ms") {
      const nextValue = Number(argv[index + 1] ?? options.timeoutMs);
      if (!Number.isNaN(nextValue) && nextValue > 0) {
        options.timeoutMs = nextValue;
      }
      index += 1;
      continue;
    }
    if (arg === "session") {
      options.mode = "session";
      continue;
    }
    if (arg === "prepare") {
      options.mode = "prepare";
      continue;
    }
    if (arg === "open") {
      options.mode = "open";
      continue;
    }
    if (arg === "help" || arg === "--help" || arg === "-h") {
      options.mode = "help";
    }
  }

  return options;
}

function printUsage() {
  console.log(
    [
      "Slack Reply Probe",
      "",
      "Usage:",
      "  pnpm probe:slack",
      "  pnpm probe:slack -- session",
      "  pnpm probe:slack -- prepare",
      "  pnpm probe:slack -- --headless",
      "  pnpm probe:slack -- --reset-profile",
      "",
      "Options:",
      "  session           Check whether the saved Slack browser profile is authenticated",
      "  prepare           Open Slack sign-in and wait for a reusable logged-in session",
      "  open              Open the target Slack page with the persistent profile (default)",
      "  --profile-dir     Override the persistent browser profile directory",
      "  --url             Override the Slack DM URL",
      "  --timeout-ms      Override page wait timeout in milliseconds",
      "  --headless        Run without showing the browser window",
      "  --reset-profile   Delete the saved probe profile before launch",
    ].join("\n"),
  );
}

function formatBoolean(value) {
  return value ? "yes" : "no";
}

async function detectSession(page, expectedUrl, timeoutMs) {
  await page.goto(expectedUrl, {
    timeout: timeoutMs,
    waitUntil: "domcontentloaded",
  });

  await page.waitForTimeout(2000);

  const currentUrl = page.url();
  const bodyText = (await page.locator("body").textContent()) ?? "";
  const normalizedText = bodyText.replace(/\s+/g, " ").trim();
  const title = await page.title().catch(() => "");

  const redirectedToSignIn =
    currentUrl.includes("/signin") ||
    currentUrl.includes("/checkcookie") ||
    currentUrl.includes("/ssb/signin");
  const loadErrorVisible =
    /unable to load slack|couldn't load slack|无法加载\s*slack|故障排除/i.test(
      normalizedText,
    ) || /unable to load slack/i.test(title);

  const composerVisible = await page
    .locator('[contenteditable="true"], div[role="textbox"], textarea')
    .first()
    .isVisible()
    .catch(() => false);

  const workspaceShellVisible = await page
    .locator(
      'a[href*="/client/"], button[aria-label*="Later"], [data-qa="message_input"]',
    )
    .first()
    .isVisible()
    .catch(() => false);

  const looksAuthenticated =
    !redirectedToSignIn &&
    !loadErrorVisible &&
    (composerVisible || workspaceShellVisible);

  return {
    looksAuthenticated,
    currentUrl,
    title,
    redirectedToSignIn,
    loadErrorVisible,
    composerVisible,
    workspaceShellVisible,
    bodyPreview: normalizedText.slice(0, 280),
  };
}

function buildPrepareUrl(slackUrl) {
  const parsedUrl = new URL(slackUrl);
  const redirectPath = `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  return `https://app.slack.com/client/signin?redir=${encodeURIComponent(redirectPath)}`;
}

async function waitForReusableSession(page, targetUrl, timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const session = await detectSession(
      page,
      targetUrl,
      defaultTimeoutMs,
    ).catch(() => null);
    if (session?.looksAuthenticated) {
      return session;
    }
    await page.waitForTimeout(3000);
  }

  return null;
}

async function ensureProfileDirectory(profileDir, resetProfile) {
  if (resetProfile && existsSync(profileDir)) {
    await rm(profileDir, { recursive: true, force: true });
  }
  await mkdir(profileDir, { recursive: true });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.mode === "help") {
    printUsage();
    return;
  }

  await ensureProfileDirectory(options.profileDir, options.resetProfile);

  console.log(`[probe] mode=${options.mode}`);
  console.log(`[probe] browserChannel=${browserChannel}`);
  console.log(`[probe] profileDir=${options.profileDir}`);
  console.log(`[probe] targetUrl=${options.slackUrl}`);
  console.log(`[probe] prepareUrl=${buildPrepareUrl(options.slackUrl)}`);
  console.log(`[probe] headless=${formatBoolean(options.headless)}`);
  console.log(`[probe] resetProfile=${formatBoolean(options.resetProfile)}`);

  const context = await chromium.launchPersistentContext(options.profileDir, {
    channel: browserChannel,
    headless: options.headless,
    viewport: { width: 1440, height: 960 },
  });

  try {
    const page = context.pages()[0] ?? (await context.newPage());

    if (options.mode === "prepare") {
      if (options.headless) {
        throw new Error("prepare mode requires a visible browser window");
      }

      console.log(
        "[probe] opening Slack sign-in. Complete login in the browser window. The probe will confirm when the session becomes reusable.",
      );
      await page.goto(buildPrepareUrl(options.slackUrl), {
        timeout: options.timeoutMs,
        waitUntil: "domcontentloaded",
      });

      const preparedSession = await waitForReusableSession(
        page,
        options.slackUrl,
        options.prepareTimeoutMs,
      );

      if (!preparedSession) {
        console.log(
          "[probe] timed out while waiting for a reusable Slack session.",
        );
        process.exitCode = 2;
        return;
      }

      console.log(`[probe] currentUrl=${preparedSession.currentUrl}`);
      console.log(
        "[probe] Slack session is now saved in the persistent profile.",
      );
      return;
    }

    const session = await detectSession(
      page,
      options.slackUrl,
      options.timeoutMs,
    );

    console.log(`[probe] currentUrl=${session.currentUrl}`);
    console.log(`[probe] title=${session.title}`);
    console.log(
      `[probe] authenticated=${formatBoolean(session.looksAuthenticated)}`,
    );
    console.log(
      `[probe] redirectedToSignIn=${formatBoolean(session.redirectedToSignIn)}`,
    );
    console.log(
      `[probe] loadErrorVisible=${formatBoolean(session.loadErrorVisible)}`,
    );
    console.log(
      `[probe] composerVisible=${formatBoolean(session.composerVisible)}`,
    );
    console.log(
      `[probe] workspaceShellVisible=${formatBoolean(session.workspaceShellVisible)}`,
    );

    if (session.bodyPreview.length > 0) {
      console.log(`[probe] bodyPreview=${session.bodyPreview}`);
    }

    if (!session.looksAuthenticated) {
      console.log(
        "[probe] login state is not ready. Run `pnpm probe:slack -- prepare`, complete Slack login in the opened browser, and wait for the session-ready message.",
      );
      process.exitCode = 2;
      return;
    }

    if (options.mode === "session") {
      console.log("[probe] saved Slack browser session looks reusable.");
      return;
    }

    console.log(
      "[probe] Slack session looks reusable. The browser will stay open until you close it.",
    );
    await page.bringToFront();
    await page.waitForTimeout(Number.POSITIVE_INFINITY);
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  console.error("[probe] failed to launch Slack probe");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exitCode = 1;
});
