import type { Stage } from "@prisma/client";
import type { OpportunityType } from "../opportunities/types";

export const CONTACTABILITY_MAX = 25;
export const OPPORTUNITY_MAX = 50;
export const READINESS_MAX = 25;

export const opportunityWeights: Record<OpportunityType, number> = { NO_WEBSITE: 30, WEBSITE_SECURITY: 15, MOBILE_READINESS: 12, CONTACT_CONVERSION: 18, CLICK_TO_CALL: 8, LOCAL_CONTACT: 15, SEO_FOUNDATION: 8, SOCIAL_SHARING: 3, DIRECT_BOOKING: 15 };
export const readinessWeights: Record<Stage, number> = { NEW: 0, QUALIFIED: 5, CONTACTED: 8, REPLIED: 15, INTERESTED: 20, AUDIT_SENT: 15, DEMO_SENT: 20, QUOTATION: 20, NEGOTIATION: 25, WON: 0, LOST: 0 };
export const readinessLabels: Record<Stage, string> = { NEW: "Lead mới", QUALIFIED: "Đã xác nhận phù hợp", CONTACTED: "Đã liên hệ", REPLIED: "Đã phản hồi", INTERESTED: "Đang quan tâm", AUDIT_SENT: "Đã gửi audit", DEMO_SENT: "Đã gửi demo", QUOTATION: "Đã gửi báo giá", NEGOTIATION: "Đang thương lượng", WON: "Đã thắng", LOST: "Đã mất" };
