import { CONTACTABILITY_MAX, OPPORTUNITY_MAX, READINESS_MAX, opportunityWeights, readinessLabels, readinessWeights } from "./weights";
import type { PriorityBand, PriorityScoreInput, PriorityScoreResult, ScoreReason } from "./types";
import { classifyBusinessUrl } from "../../lib/url-classification";

export function priorityBand(total: number): PriorityBand { return total >= 70 ? "HOT" : total >= 45 ? "WARM" : "LOW"; }

export function calculatePriorityScore({ lead, opportunityResult, hasSuccessfulAudit }: PriorityScoreInput): PriorityScoreResult {
  if (lead.stage === "WON" || lead.stage === "LOST") return { total: 0, band: "CLOSED", contactability: 0, opportunity: 0, readiness: 0, reasons: [], opportunityIncomplete: false };
  const reasons: ScoreReason[] = [];
  const add = (reason: ScoreReason) => reasons.push(reason);
  const urlClassification = classifyBusinessUrl(lead.websiteUrl);
  if (lead.phone) add({ code: "CONTACT_PHONE", label: "Có số điện thoại", points: 12, group: "CONTACTABILITY" });
  if (urlClassification.kind === "STANDALONE_WEBSITE") add({ code: "CONTACT_WEBSITE", label: "Có website riêng", points: 5, group: "CONTACTABILITY" });
  if (lead.email) add({ code: "CONTACT_EMAIL", label: "Có email", points: 5, group: "CONTACTABILITY" });
  if (urlClassification.kind === "SOCIAL_PROFILE" || lead.facebookUrl || lead.instagramUrl || lead.zaloUrl) add({ code: "CONTACT_SOCIAL", label: "Có kênh mạng xã hội trực tiếp", points: 3, group: "CONTACTABILITY" });

  const seen = new Set<string>();
  for (const opportunity of opportunityResult.opportunities) {
    if (seen.has(opportunity.type)) continue;
    seen.add(opportunity.type);
    add({ code: `OPPORTUNITY_${opportunity.type}`, label: opportunity.title, points: opportunityWeights[opportunity.type], group: "OPPORTUNITY" });
  }
  const readiness = readinessWeights[lead.stage];
  if (readiness > 0) add({ code: `STAGE_${lead.stage}`, label: readinessLabels[lead.stage], points: readiness, group: "READINESS" });
  const groupTotal = (group: ScoreReason["group"], cap: number) => Math.min(cap, reasons.filter((reason) => reason.group === group).reduce((sum, reason) => sum + reason.points, 0));
  const contactability = groupTotal("CONTACTABILITY", CONTACTABILITY_MAX); const opportunity = groupTotal("OPPORTUNITY", OPPORTUNITY_MAX); const readinessScore = groupTotal("READINESS", READINESS_MAX);
  const total = Math.min(100, contactability + opportunity + readinessScore);
  return { total, band: priorityBand(total), contactability, opportunity, readiness: readinessScore, reasons, opportunityIncomplete: urlClassification.kind === "STANDALONE_WEBSITE" && !hasSuccessfulAudit };
}

export function sortByPriority<T extends { score: PriorityScoreResult; updatedAt: Date }>(items: T[]) {
  return [...items].sort((a, b) => b.score.total - a.score.total || b.updatedAt.getTime() - a.updatedAt.getTime());
}
