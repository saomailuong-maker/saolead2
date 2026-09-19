import type { OpportunitySeverity, OpportunityType } from "./types";

export const severityRank: Record<OpportunitySeverity, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
export const ruleOrder: OpportunityType[] = ["NO_WEBSITE", "WEBSITE_SECURITY", "CONTACT_CONVERSION", "LOCAL_CONTACT", "MOBILE_READINESS", "CLICK_TO_CALL", "SEO_FOUNDATION", "DIRECT_BOOKING", "SOCIAL_SHARING"];

export function isAccommodation(industry: string | null) {
  return Boolean(industry && /(homestay|hotel|villa|resort|khách sạn|lodging)/i.test(industry));
}
