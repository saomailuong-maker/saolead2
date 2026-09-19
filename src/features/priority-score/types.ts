import type { Stage } from "@prisma/client";
import type { OpportunityResult } from "../opportunities/types";

export type PriorityBand = "HOT" | "WARM" | "LOW" | "CLOSED";
export type ScoreGroup = "CONTACTABILITY" | "OPPORTUNITY" | "READINESS";
export type ScoreReason = { code: string; label: string; points: number; group: ScoreGroup };
export type PriorityScoreResult = { total: number; band: PriorityBand; contactability: number; opportunity: number; readiness: number; reasons: ScoreReason[]; opportunityIncomplete: boolean };
export type PriorityLead = { phone: string | null; websiteUrl: string | null; email: string | null; facebookUrl: string | null; instagramUrl: string | null; zaloUrl: string | null; stage: Stage };
export type PriorityScoreInput = { lead: PriorityLead; opportunityResult: OpportunityResult; hasSuccessfulAudit: boolean };
