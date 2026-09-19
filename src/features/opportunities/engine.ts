import { isAccommodation, ruleOrder, severityRank } from "./rules";
import type { LeadOpportunity, OpportunityLead, OpportunityResult, OpportunityScan } from "./types";

export function generateOpportunities(lead: OpportunityLead, scan: OpportunityScan): OpportunityResult {
  const opportunities: LeadOpportunity[] = [];
  const add = (opportunity: LeadOpportunity) => opportunities.push(opportunity);
  if (!lead.websiteUrl?.trim()) add({ type: "NO_WEBSITE", severity: "HIGH", title: "Chưa có website riêng", reason: "Lead hiện chưa có website được lưu trong CRM.", suggestedService: "Website doanh nghiệp / landing page", evidenceCodes: ["CRM_NO_WEBSITE"], evidence: ["Trường website trong CRM đang để trống."] });

  const successful = scan?.status === "SUCCESS" && scan.checks ? scan : null;
  const auditChecks = successful?.checks;
  if (successful && auditChecks) {
    const codes = new Set(successful.findings.map((finding) => finding.code));
    const findingEvidence = (code: string) => successful.findings.find((finding) => finding.code === code)?.title || code;
    if (codes.has("NO_HTTPS")) add({ type: "WEBSITE_SECURITY", severity: "HIGH", title: "Website chưa dùng HTTPS", reason: "URL cuối trong lần quét trang chủ sử dụng HTTP thay vì HTTPS.", suggestedService: "HTTPS / khắc phục kỹ thuật website", evidenceCodes: ["NO_HTTPS"], evidence: [findingEvidence("NO_HTTPS")] });
    if (codes.has("MISSING_VIEWPORT")) add({ type: "MOBILE_READINESS", severity: "MEDIUM", title: "Chưa tìm thấy cấu hình viewport mobile", reason: "Không tìm thấy meta viewport trong HTML trang chủ được quét.", suggestedService: "Tối ưu mobile / website responsive", evidenceCodes: ["MISSING_VIEWPORT"], evidence: [findingEvidence("MISSING_VIEWPORT")] });

    const contact = auditChecks.contact;
    const noDirectChannels = contact.telLinks === 0 && contact.mailtoLinks === 0 && contact.forms === 0 && !contact.zalo && !contact.messenger && !contact.whatsapp;
    if (codes.has("MISSING_CONTACT_CTA")) {
      const evidenceCodes = ["MISSING_CONTACT_CTA"]; const evidence = [findingEvidence("MISSING_CONTACT_CTA")];
      if (noDirectChannels) { evidenceCodes.push("NO_DIRECT_CONTACT_SIGNALS"); evidence.push("Không tìm thấy tel, mailto, form, Zalo, Messenger hoặc WhatsApp trong trang chủ được quét."); }
      add({ type: "CONTACT_CONVERSION", severity: "HIGH", title: "Thiếu CTA liên hệ rõ ràng", reason: noDirectChannels ? "Không tìm thấy CTA hoặc tín hiệu liên hệ trực tiếp rõ ràng trong lần quét trang chủ." : "Không tìm thấy CTA liên hệ rõ ràng trong lần quét trang chủ.", suggestedService: "Tối ưu CTA / luồng liên hệ", evidenceCodes, evidence });
    } else if (noDirectChannels) add({ type: "LOCAL_CONTACT", severity: "HIGH", title: "Ít tín hiệu liên hệ trực tiếp trên trang chủ", reason: "Không tìm thấy tel, mailto, form, Zalo, Messenger hoặc WhatsApp trong trang chủ được quét.", suggestedService: "Thiết lập chuyển đổi liên hệ", evidenceCodes: ["NO_DIRECT_CONTACT_SIGNALS"], evidence: ["Các tín hiệu liên hệ trực tiếp đều không được tìm thấy trong trang chủ được quét."] });

    if (codes.has("MISSING_CLICK_TO_CALL")) add({ type: "CLICK_TO_CALL", severity: "MEDIUM", title: "Chưa có click-to-call rõ ràng", reason: lead.phone ? "CRM đã có số điện thoại nhưng không tìm thấy liên kết gọi trực tiếp trong trang chủ được quét." : "Không tìm thấy liên kết gọi trực tiếp trong trang chủ được quét.", suggestedService: "Tối ưu điện thoại / Zalo / liên hệ", evidenceCodes: [...(lead.phone ? ["CRM_PHONE_PRESENT"] : []), "MISSING_CLICK_TO_CALL"], evidence: [...(lead.phone ? ["CRM đã có số điện thoại."] : []), findingEvidence("MISSING_CLICK_TO_CALL")] });

    const seoCodes = ["MISSING_META_DESCRIPTION", "MISSING_CANONICAL"].filter((code) => codes.has(code));
    if (seoCodes.length) add({ type: "SEO_FOUNDATION", severity: "MEDIUM", title: "SEO cơ bản còn thiếu", reason: "Một số thành phần SEO cơ bản không được tìm thấy trong lần quét trang chủ.", suggestedService: "Nền tảng SEO on-page", evidenceCodes: seoCodes, evidence: seoCodes.map(findingEvidence) });
    if (codes.has("MISSING_OG_TITLE")) add({ type: "SOCIAL_SHARING", severity: "LOW", title: "Metadata chia sẻ mạng xã hội chưa đầy đủ", reason: "Không tìm thấy Open Graph title trong lần quét trang chủ.", suggestedService: "Tối ưu Open Graph / metadata mạng xã hội", evidenceCodes: ["MISSING_OG_TITLE"], evidence: [findingEvidence("MISSING_OG_TITLE")] });
    if (isAccommodation(lead.industry) && !auditChecks.structure.booking) add({ type: "DIRECT_BOOKING", severity: "MEDIUM", title: "Chưa tìm thấy tín hiệu đặt phòng trực tiếp", reason: "Không tìm thấy trong trang chủ được quét.", suggestedService: "Luồng landing đặt phòng trực tiếp", evidenceCodes: ["CRM_ACCOMMODATION_INDUSTRY", "HOMEPAGE_BOOKING_NOT_FOUND"], evidence: [`Ngành trong CRM: ${lead.industry}.`, "Không tìm thấy liên kết hoặc tín hiệu booking trong trang chủ được quét."] });
  }

  opportunities.sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || ruleOrder.indexOf(a.type) - ruleOrder.indexOf(b.type));
  return { opportunities, contactReasons: opportunities.slice(0, 3).map((opportunity) => opportunity.reason), auditLimited: Boolean(scan && scan.status !== "SUCCESS") };
}
