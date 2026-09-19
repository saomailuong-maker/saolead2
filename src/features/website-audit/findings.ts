import type { AuditChecks, AuditFinding } from "./types";

export function generateFindings(checks: AuditChecks): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const add = (severity: AuditFinding["severity"], code: string, title: string, evidence?: string) => findings.push({ severity, code, title, ...(evidence ? { evidence } : {}) });
  if (!checks.reachability.https) add("HIGH", "NO_HTTPS", "Website không dùng HTTPS", checks.reachability.finalUrl);
  if (!checks.seo.description) add("MEDIUM", "MISSING_META_DESCRIPTION", "Không tìm thấy meta description trong lần quét này");
  if (!checks.seo.viewport) add("MEDIUM", "MISSING_VIEWPORT", "Không tìm thấy viewport mobile");
  if (!checks.contact.ctas.length) add("MEDIUM", "MISSING_CONTACT_CTA", "Không tìm thấy CTA liên hệ rõ ràng");
  if (!checks.contact.telLinks) add("MEDIUM", "MISSING_CLICK_TO_CALL", "Không tìm thấy số điện thoại click-to-call");
  if (!checks.seo.canonical) add("LOW", "MISSING_CANONICAL", "Không tìm thấy canonical");
  if (!checks.seo.openGraphTitle) add("LOW", "MISSING_OG_TITLE", "Không tìm thấy Open Graph title");
  return findings;
}
