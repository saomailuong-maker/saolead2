import type { SalesDraft } from "./types";

export type ToneCheckResult = { valid: boolean; violations: string[] };
const words = (value: string) => value.trim().split(/\s+/u).filter(Boolean).length;
const questions = (value: string) => (value.match(/\?/g) || []).length;
const forbidden = /WEBSITE_OPPORTUNITY|OPTIMIZE_EXISTING|DISCOVERY_FIRST|LOW_PRIORITY|\bHIGH\b|CRM_[A-Z_]+|MISSING_[A-Z_]+|evidence(?: code)?|provider|phân loại URL|liên kết(?: hiện tại)? thuộc nền tảng|cơ hội website riêng|độ tin cậy HIGH|em đang tìm hiểu thông tin của/iu;

export function checkCustomerFacingTone(draft: SalesDraft): ToneCheckResult {
  const violations: string[] = []; const styles = new Set(draft.messageVariants.map((item) => item.style));
  if (styles.size !== 3 || !styles.has("NATURAL") || !styles.has("VALUE_FIRST") || !styles.has("DEMO_FIRST")) violations.push("MISSING_REQUIRED_VARIANTS");
  for (const variant of draft.messageVariants) {
    const prefix = variant.style;
    const dmWords = words(variant.zaloFacebookDm); const emailWords = words(variant.email);
    if (dmWords < 35 || dmWords > 70) violations.push(`${prefix}_DM_WORD_COUNT`);
    if (emailWords < 80 || emailWords > 140) violations.push(`${prefix}_EMAIL_WORD_COUNT`);
    if (questions(variant.zaloFacebookDm) > 1 || questions(variant.email) > 1) violations.push(`${prefix}_TOO_MANY_FIRST_CONTACT_QUESTIONS`);
    if (questions(variant.phoneOpener) !== 1) violations.push(`${prefix}_PHONE_PERMISSION_QUESTION`);
    if (forbidden.test(`${variant.zaloFacebookDm} ${variant.phoneOpener} ${variant.email}`)) violations.push(`${prefix}_INTERNAL_LANGUAGE`);
  }
  return { valid: violations.length === 0, violations: [...new Set(violations)] };
}
