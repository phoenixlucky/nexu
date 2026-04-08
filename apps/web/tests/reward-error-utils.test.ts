import { describe, expect, it } from "vitest";
import { getRewardErrorMessage } from "../src/lib/reward-error-utils";

describe("getRewardErrorMessage", () => {
  it("prefers a top-level message string", () => {
    expect(getRewardErrorMessage({ message: "Session expired, please start over" }))
      .toBe("Session expired, please start over");
  });

  it("falls back to nested error message strings", () => {
    expect(
      getRewardErrorMessage({
        error: {
          message: "You haven't starred the repository yet",
        },
      }),
    ).toBe("You haven't starred the repository yet");
  });

  it("returns null for unknown shapes", () => {
    expect(getRewardErrorMessage(new Error("boom"))).toBe(null);
    expect(getRewardErrorMessage({})).toBe(null);
    expect(getRewardErrorMessage(null)).toBe(null);
  });
});
