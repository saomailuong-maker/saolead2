import { describe, expect, it, vi } from "vitest";
import { generateDraftWithOpenAI } from "./openai";
import type { SalesDraft, SalesStrategy } from "./types";

const strategy: SalesStrategy = { recommendation: "DISCOVERY_FIRST", confidence: "LOW", primaryAngle: "Hỏi trước", supportingEvidence: [], risks: [], discoveryQuestions: ["Nguồn khách ở đâu?"], allowedClaims: [], prohibitedClaims: [] };
const messageVariants: SalesDraft["messageVariants"] = (["NATURAL", "VALUE_FIRST", "DEMO_FIRST"] as const).map((style) => ({ style, zaloFacebookDm: Array(40).fill("chào").join(" "), phoneOpener: "Chào anh chị, em có một ý tưởng ngắn. Em xin phép chia sẻ trong một phút được không?", email: Array(90).fill("chào").join(" ") }));
const validDraft: SalesDraft = { recommendation: "DISCOVERY_FIRST", reasoningSummary: "Chưa đủ dữ liệu để đề xuất.", discoveryQuestions: ["Khách hiện đến từ đâu?"], messageVariants, likelyObjections: [], demoRecommendation: { shouldPrepareDemo: false, reason: "Cần khám phá nhu cầu trước.", demoType: "NEEDS_DISCOVERY" }, claimsUsed: [] };
const client = (output: unknown) => ({ responses: { parse: vi.fn().mockResolvedValue({ output_parsed: output }) } });

describe("OpenAI sales draft adapter", () => {
  it("accepts a valid strict draft with exactly one Responses call", async () => { const mock = client(validDraft); await expect(generateDraftWithOpenAI({}, strategy, { client: mock, model: "test-model" })).resolves.toEqual({ draft: validDraft, model: "test-model" }); expect(mock.responses.parse).toHaveBeenCalledOnce(); });
  it("rejects malformed output", async () => { await expect(generateDraftWithOpenAI({}, strategy, { client: client({ firstMessage: "missing fields" }), model: "test-model" })).rejects.toMatchObject({ code: "MALFORMED_OUTPUT" }); });
  it("rejects unsupported guarantees", async () => { const unsafe = { ...validDraft, messageVariants: validDraft.messageVariants.map((item, index) => index ? item : { ...item, zaloFacebookDm: `${item.zaloFacebookDm} Website chắc chắn tăng booking và đảm bảo lên top Google.` }) }; await expect(generateDraftWithOpenAI({}, strategy, { client: client(unsafe), model: "test-model" })).rejects.toMatchObject({ code: "UNSUPPORTED_CLAIMS" }); });
});
