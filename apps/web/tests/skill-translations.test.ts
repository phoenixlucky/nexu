import { describe, expect, it } from "vitest";
import { getSkillSearchText } from "../src/lib/skill-translations";

describe("getSkillSearchText", () => {
  it("includes localized Chinese display text in zh locale", () => {
    const searchText = getSkillSearchText(
      "second-brain",
      "Second Brain",
      "Build a personal knowledge base",
      "zh",
    );

    expect(searchText).toContain("第二大脑");
  });

  it("keeps source English text searchable in zh locale", () => {
    const searchText = getSkillSearchText(
      "second-brain",
      "Second Brain",
      "Build a personal knowledge base",
      "zh",
    );

    expect(searchText).toContain("second brain");
    expect(searchText).toContain("build a personal knowledge base");
    expect(searchText).toContain("second-brain");
  });
});
