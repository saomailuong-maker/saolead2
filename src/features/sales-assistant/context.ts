import { createHash } from "node:crypto";
import { classifyBusinessUrl } from "../../lib/url-classification";
import type { OpportunityResult } from "../opportunities/types";
import type { PriorityScoreResult } from "../priority-score/types";
import type { AuditChecks, AuditFinding } from "../website-audit/types";
import { selectedPlaybookRules } from "./playbook";
import type { SalesStrategy } from "./types";

type ContextLead = { businessName: string; industry: string | null; locationText: string | null; stage: string; websiteUrl: string | null; phone: string | null; email: string | null; facebookUrl: string | null; instagramUrl: string | null; zaloUrl: string | null };
export function buildVerifiedContext(lead: ContextLead, priority: PriorityScoreResult, opportunities: OpportunityResult, strategy: SalesStrategy, audit: { status: string; checks: AuditChecks | null; findings: AuditFinding[] } | null) {
  const classification = classifyBusinessUrl(lead.websiteUrl);
  return {
    lead: { businessName: lead.businessName, industry: lead.industry, location: lead.locationText, stage: lead.stage, websiteKind: classification.kind, socialPlatform: classification.platform, contactChannels: { phone: Boolean(lead.phone), email: Boolean(lead.email), facebook: Boolean(lead.facebookUrl) || classification.platform === "Facebook", instagram: Boolean(lead.instagramUrl) || classification.platform === "Instagram", zalo: Boolean(lead.zaloUrl) || classification.platform === "Zalo" } },
    priority: { total: priority.total, band: priority.band, reasons: priority.reasons.map((reason) => ({ code: reason.code, label: reason.label, points: reason.points })) },
    opportunities: opportunities.opportunities.map((item) => ({ type: item.type, severity: item.severity, title: item.title, reason: item.reason, evidenceCodes: item.evidenceCodes, evidence: item.evidence })),
    auditSummary: audit ? { status: audit.status, findingCodes: audit.findings.map((finding) => finding.code), contact: audit.checks ? { telLinks: audit.checks.contact.telLinks, mailtoLinks: audit.checks.contact.mailtoLinks, forms: audit.checks.contact.forms, ctaCount: audit.checks.contact.ctas.length } : null, structure: audit.checks?.structure ?? null } : null,
    salesStrategy: strategy,
    selectedPlaybookRules: selectedPlaybookRules(lead.industry),
  };
}
export function contextDigest(context: unknown) { return createHash("sha256").update(JSON.stringify(context)).digest("hex"); }
