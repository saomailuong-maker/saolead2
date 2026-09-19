import { z } from "zod";

export const demoTypeSchema = z.enum(["ONE_PAGE", "OPTIMIZATION_MOCKUP", "BOOKING_FLOW", "NONE"]);
export const demoPresetSchema = z.enum(["MODERN_MINIMAL", "WARM_HOSPITALITY", "PREMIUM_DARK", "LOCAL_FRIENDLY"]);
export const ctaTargetSchema = z.enum(["PHONE", "ZALO", "MESSENGER", "FORM", "PLACEHOLDER"]);
export type DemoType = z.infer<typeof demoTypeSchema>;
export type DemoPreset = z.infer<typeof demoPresetSchema>;

export const demoBriefSchema = z.object({
  leadId: z.string().uuid(), demoType: demoTypeSchema,
  brand: z.object({ businessName: z.string(), industry: z.string().optional(), location: z.string().optional(), phone: z.string().optional(), website: z.string().optional() }),
  objective: z.string(), primaryCTA: z.object({ label: z.string(), target: ctaTargetSchema }),
  sections: z.array(z.object({ id: z.string(), title: z.string(), purpose: z.string() })),
  evidenceUsed: z.array(z.string()), assumptions: z.array(z.string()), missingData: z.array(z.string()),
});
export type DemoBrief = z.infer<typeof demoBriefSchema>;

export const demoContentSchema = z.object({
  version: z.literal(1), headline: z.string().trim().min(1).max(160), subheadline: z.string().trim().min(1).max(400),
  primaryCTA: z.object({ label: z.string().trim().min(1).max(60), target: ctaTargetSchema }),
  secondaryCTA: z.object({ label: z.string().trim().min(1).max(60), anchor: z.string() }).optional(),
  sections: z.array(z.object({ id: z.string(), visible: z.boolean(), title: z.string().trim().min(1).max(120), body: z.string().trim().min(1).max(600) })).max(12),
});
export type DemoContent = z.infer<typeof demoContentSchema>;
