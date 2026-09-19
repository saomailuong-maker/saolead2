import { z } from "zod";

const itemSchema = z.object({ title: z.string().min(1).max(200), detail: z.string().min(1).max(1000) });
export const publicAuditSnapshotSchema = z.object({
  version: z.literal(1),
  business: z.object({ name: z.string().min(1).max(200), industry: z.string().max(200).optional(), location: z.string().max(250).optional(), website: z.string().url().optional() }),
  reportType: z.enum(["SOCIAL_ONLY", "WEBSITE_AUDIT"]),
  summary: z.object({ headline: z.string().min(1).max(500), intro: z.string().min(1).max(1200) }),
  observations: z.array(itemSchema.extend({ severity: z.enum(["HIGH", "MEDIUM", "LOW"]).optional() })).max(5),
  opportunities: z.array(itemSchema).max(4), recommendations: z.array(itemSchema).max(3),
  cta: itemSchema, generatedAt: z.string().datetime(),
});
export type PublicAuditSnapshot = z.infer<typeof publicAuditSnapshotSchema>;
