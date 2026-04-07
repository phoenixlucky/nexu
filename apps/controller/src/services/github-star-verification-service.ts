import type { NexuConfigStore } from "../store/nexu-config-store.js";

export type PrepareGithubStarSessionResult = {
  sessionId: string;
  baselineStars: number;
  expiresAt: string;
};

export type VerifyGithubStarSessionResult =
  | { ok: true; currentStars: number }
  | { ok: false; reason: "missing" | "expired" | "not_increased" };

/**
 * Delegates GitHub star reward verification to the Cloud API. The cloud owns
 * both the GitHub API fetch (using the server-side NEXU_GITHUB_TOKEN) and the
 * baseline comparison, sealing `{userId, baseline, exp}` into an AES-GCM
 * encrypted session token that the desktop echoes back on verify.
 *
 * This service is intentionally stateless: the `sessionId` it exposes to the
 * frontend/SDK is a verbatim passthrough of the cloud's opaque `sessionToken`,
 * so the controller process never holds any in-memory baseline that would be
 * lost on restart and no NEXU_GITHUB_TOKEN needs to be shipped in the desktop
 * build.
 */
export class GithubStarVerificationService {
  constructor(private readonly configStore: NexuConfigStore) {}

  async prepareSession(): Promise<PrepareGithubStarSessionResult> {
    const cloud = await this.configStore.createCloudRewardService();
    if (!cloud) {
      throw new Error("Desktop cloud is not connected");
    }
    const result = await cloud.prepareGithubStarSession();
    if (!result.ok) {
      throw new Error(
        `Failed to prepare GitHub star session: ${result.reason}${
          result.message ? ` (${result.message})` : ""
        }`,
      );
    }
    return {
      sessionId: result.data.sessionToken,
      baselineStars: result.data.baselineStars,
      expiresAt: result.data.expiresAt,
    };
  }

  async verifySession(
    sessionId: string,
  ): Promise<VerifyGithubStarSessionResult> {
    const cloud = await this.configStore.createCloudRewardService();
    if (!cloud) {
      return { ok: false, reason: "missing" };
    }
    const result = await cloud.verifyGithubStarSession(sessionId);
    if (!result.ok) {
      // Transport / auth / parse failures map to "missing" so the
      // desktop-rewards-routes handler surfaces "Invalid session".
      return { ok: false, reason: "missing" };
    }
    const verdict = result.data;
    if (verdict.ok) {
      return { ok: true, currentStars: verdict.currentStars };
    }
    // Cloud's "invalid" (bad ciphertext, tampered token, cross-user replay)
    // is surfaced as "missing" because desktop-rewards-routes has no
    // dedicated copy for that bucket.
    if (verdict.reason === "invalid") {
      return { ok: false, reason: "missing" };
    }
    return { ok: false, reason: verdict.reason };
  }
}
