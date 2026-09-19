import { describe, expect, it } from "vitest";
import { createPublicToken, isObviousPreviewBot, isValidPublicToken } from "./security";

describe("public report token security", () => {
  it("creates distinct tokens with at least 256 bits of randomness", () => { const a = createPublicToken(); const b = createPublicToken(); expect(a).not.toBe(b); expect(isValidPublicToken(a)).toBe(true); expect(Buffer.from(a, "base64url")).toHaveLength(32); });
  it("recognizes obvious preview bots conservatively", () => { expect(isObviousPreviewBot("facebookexternalhit/1.1")).toBe(true); expect(isObviousPreviewBot("Mozilla/5.0 Chrome")).toBe(false); });
});
