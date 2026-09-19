import { z } from "zod";

export const salesRecommendationSchema = z.enum(["WEBSITE_OPPORTUNITY", "OPTIMIZE_EXISTING", "DISCOVERY_FIRST", "LOW_PRIORITY", "CLOSED"]);
export type SalesRecommendation = z.infer<typeof salesRecommendationSchema>;
export const salesStrategySchema = z.object({ recommendation: salesRecommendationSchema, confidence: z.enum(["HIGH", "MEDIUM", "LOW"]), primaryAngle: z.string(), supportingEvidence: z.array(z.string()), risks: z.array(z.string()), discoveryQuestions: z.array(z.string()), allowedClaims: z.array(z.string()), prohibitedClaims: z.array(z.string()) });
export type SalesStrategy = z.infer<typeof salesStrategySchema>;

export const outreachVariantSchema = z.object({ style: z.enum(["NATURAL", "VALUE_FIRST", "DEMO_FIRST"]), zaloFacebookDm: z.string().trim().min(1).max(1200), phoneOpener: z.string().trim().min(1).max(500), email: z.string().trim().min(1).max(2400) });
export type OutreachVariant = z.infer<typeof outreachVariantSchema>;

export const salesDraftSchema = z.object({
  recommendation: salesRecommendationSchema,
  reasoningSummary: z.string().trim().min(1).max(800),
  discoveryQuestions: z.array(z.string().trim().min(1).max(300)).min(1).max(6),
  messageVariants: z.array(outreachVariantSchema).length(3),
  likelyObjections: z.array(z.object({ objection: z.string().trim().min(1).max(200), response: z.string().trim().min(1).max(800), followUpQuestion: z.string().trim().min(1).max(300) })).max(7),
  demoRecommendation: z.object({ shouldPrepareDemo: z.boolean(), reason: z.string().trim().min(1).max(500), demoType: z.enum(["NONE", "ONE_PAGE", "OPTIMIZATION_MOCKUP", "BOOKING_FLOW", "NEEDS_DISCOVERY"]) }),
  claimsUsed: z.array(z.string().trim().min(1).max(300)).max(20),
});
export type SalesDraft = z.infer<typeof salesDraftSchema>;

export class SalesAssistantError extends Error {
  constructor(public readonly code: "CONFIG" | "PROVIDER" | "MALFORMED_OUTPUT" | "UNSUPPORTED_CLAIMS", message: string) { super(message); this.name = "SalesAssistantError"; }
}
