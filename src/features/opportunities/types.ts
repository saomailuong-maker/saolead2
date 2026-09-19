import type { AuditChecks, AuditFinding } from "../website-audit/types";

export type OpportunitySeverity = "HIGH" | "MEDIUM" | "LOW";
export type OpportunityType = "NO_WEBSITE" | "WEBSITE_SECURITY" | "MOBILE_READINESS" | "CONTACT_CONVERSION" | "CLICK_TO_CALL" | "LOCAL_CONTACT" | "SEO_FOUNDATION" | "SOCIAL_SHARING" | "DIRECT_BOOKING";

export type LeadOpportunity = {
  type: OpportunityType;
  severity: OpportunitySeverity;
  title: string;
  reason: string;
  suggestedService: string;
  evidenceCodes: string[];
  evidence: string[];
};

export type OpportunityLead = { websiteUrl: string | null; phone: string | null; industry: string | null };
export type OpportunityScan = { status: "PENDING" | "SUCCESS" | "FAILED"; checks: AuditChecks | null; findings: AuditFinding[] } | null;
export type OpportunityResult = { opportunities: LeadOpportunity[]; contactReasons: string[]; auditLimited: boolean };
