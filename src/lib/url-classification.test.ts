import { describe, expect, it } from "vitest";
import { classifyBusinessUrl } from "./url-classification";

describe("business URL classification", () => {
  it.each(["https://facebook.com/business", "https://m.facebook.com/business"])("classifies Facebook URL %s as social", (url) => { expect(classifyBusinessUrl(url)).toMatchObject({ kind: "SOCIAL_PROFILE", platform: "Facebook" }); });
  it("classifies Instagram as social", () => { expect(classifyBusinessUrl("https://instagram.com/business")).toMatchObject({ kind: "SOCIAL_PROFILE", platform: "Instagram" }); });
  it("classifies a normal domain as a standalone website", () => { expect(classifyBusinessUrl("https://example.com")).toMatchObject({ kind: "STANDALONE_WEBSITE", platform: null }); });
  it.each([null, "", "not a url", "mailto:hello@example.com"])("classifies %s as empty or invalid", (url) => { expect(classifyBusinessUrl(url)).toMatchObject({ kind: "EMPTY_OR_INVALID" }); });
});
