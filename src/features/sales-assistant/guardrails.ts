import type { SalesDraft, SalesStrategy } from "./types";

export type ClaimGuardrailResult = { valid: boolean; violations: string[] };
export function checkDraftClaims(draft: SalesDraft, strategy: SalesStrategy): ClaimGuardrailResult {
  const messages = draft.messageVariants.flatMap((variant) => [variant.zaloFacebookDm, variant.phoneOpener, variant.email]);
  const text = [draft.reasoningSummary, ...messages, ...draft.discoveryQuestions, ...draft.likelyObjections.flatMap((item) => [item.response, item.followUpQuestion]), draft.demoRecommendation.reason].join(" ").toLocaleLowerCase("vi-VN");
  const violations: string[] = [];
  if (/\b\d+(?:[.,]\d+)?\s*(?:%|phần trăm)/u.test(text)) violations.push("UNSUPPORTED_PERCENTAGE");
  if (/(?:mất|thất thoát)\s+(?:rất\s+)?(?:nhiều\s+)?(?:khách|doanh thu|tiền)|doanh thu\s+(?:sẽ|chắc chắn)\s+tăng/u.test(text)) violations.push("UNSUPPORTED_REVENUE_LOSS");
  if (/(?:chắc chắn|cam kết|đảm bảo).{0,40}(?:tăng|top|xếp hạng|booking|đặt phòng)/u.test(text) || /(?:sẽ|đảm bảo)\s+lên\s+top/u.test(text)) violations.push("UNSUPPORTED_GUARANTEE");
  if (/(?:so với|các?)\s+đối thủ.{0,50}(?:tốt hơn|kém hơn|đang|đã|có)/u.test(text)) violations.push("UNSUPPORTED_COMPETITOR_CLAIM");
  if (/hoa hồng.{0,25}\d|\d.{0,25}hoa hồng/u.test(text)) violations.push("UNSUPPORTED_OTA_COMMISSION");
  const allowed = new Set(strategy.allowedClaims);
  if (draft.claimsUsed.some((claim) => !allowed.has(claim))) violations.push("CLAIM_NOT_IN_VERIFIED_EVIDENCE");
  return { valid: violations.length === 0, violations: [...new Set(violations)] };
}
