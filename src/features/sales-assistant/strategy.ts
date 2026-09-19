import type { Stage } from "@prisma/client";
import { classifyBusinessUrl } from "../../lib/url-classification";
import type { LeadOpportunity, OpportunityResult } from "../opportunities/types";
import type { PriorityScoreResult } from "../priority-score/types";
import type { SalesStrategy } from "./types";

type StrategyLead = { stage: Stage; industry: string | null; websiteUrl: string | null };
const conversionTypes = new Set(["CONTACT_CONVERSION", "CLICK_TO_CALL", "DIRECT_BOOKING", "LOCAL_CONTACT"]);
const fixedProhibited = ["Không khẳng định đang mất khách hoặc doanh thu.", "Không đảm bảo tăng booking, tăng doanh thu hoặc lên top Google.", "Không tự nêu ROI, tỷ lệ chuyển đổi, hoa hồng OTA hoặc hành vi đối thủ."];
const questions = ["Khách hiện thường biết đến cơ sở từ kênh nào?", "Khách thường hỏi lặp lại điều gì trước khi gọi, nhắn hoặc đặt?", "Kết quả nào cần cải thiện trước thì giải pháp mới đáng làm?"];

function evidence(opportunities: LeadOpportunity[]) { return opportunities.flatMap((item) => item.evidence.slice(0, 2)).slice(0, 6); }
export function buildSalesStrategy(lead: StrategyLead, opportunityResult: OpportunityResult, priority: PriorityScoreResult): SalesStrategy {
  if (lead.stage === "WON" || lead.stage === "LOST") return { recommendation: "CLOSED", confidence: "HIGH", primaryAngle: "Lead đã đóng; không tạo lý do bán hàng mới.", supportingEvidence: [`Trạng thái CRM: ${lead.stage}.`], risks: ["Tiếp cận lại khi chưa có lý do hoặc yêu cầu mới."], discoveryQuestions: [], allowedClaims: [`Lead có trạng thái ${lead.stage}.`], prohibitedClaims: fixedProhibited };
  const classification = classifyBusinessUrl(lead.websiteUrl); const opportunities = opportunityResult.opportunities;
  if (classification.kind !== "STANDALONE_WEBSITE") {
    const social = classification.kind === "SOCIAL_PROFILE";
    const supportingEvidence = evidence(opportunities);
    return { recommendation: "WEBSITE_OPPORTUNITY", confidence: supportingEvidence.length ? "HIGH" : "MEDIUM", primaryAngle: `${social ? "Giữ kênh mạng xã hội hiện có và" : "Cân nhắc"} bổ sung một điểm đến sở hữu để trình bày thông tin chi tiết và CTA trực tiếp; không định vị website là kênh thay thế.`, supportingEvidence, risks: ["Chưa biết nguồn khách chính và vấn đề thực tế trước khi đặt/liên hệ.", "Không được mặc định cơ sở cần website nếu không có nhu cầu rõ."], discoveryQuestions: questions.slice(0, 2), allowedClaims: supportingEvidence, prohibitedClaims: fixedProhibited };
  }
  const conversion = opportunities.filter((item) => conversionTypes.has(item.type));
  if (conversion.length) { const supportingEvidence = evidence(conversion); return { recommendation: "OPTIMIZE_EXISTING", confidence: "HIGH", primaryAngle: "Tối ưu website hiện có quanh CTA và luồng liên hệ/đặt trực tiếp; chưa có cơ sở để đề nghị xây lại.", supportingEvidence, risks: ["Audit chỉ phản ánh HTML trang chủ tại thời điểm quét.", "Chưa có dữ liệu chuyển đổi thực tế."], discoveryQuestions: ["Website hiện được kỳ vọng tạo cuộc gọi, tin nhắn hay booking?", "Khách đang dừng lại ở bước nào trong luồng liên hệ hoặc đặt?"], allowedClaims: supportingEvidence, prohibitedClaims: fixedProhibited }; }
  const seoOnly = opportunities.length > 0 && opportunities.every((item) => item.type === "SEO_FOUNDATION" || item.type === "SOCIAL_SHARING");
  if (seoOnly) { const supportingEvidence = evidence(opportunities); return { recommendation: "DISCOVERY_FIRST", confidence: "MEDIUM", primaryAngle: "Xác nhận SEO, quảng cáo hoặc khả năng được tìm thấy có thật sự là mục tiêu kinh doanh trước khi đề xuất kỹ thuật.", supportingEvidence, risks: ["Thiếu dữ liệu traffic và mục tiêu tìm kiếm.", "Các thiếu sót SEO cơ bản chưa chứng minh tác động kinh doanh."], discoveryQuestions: ["SEO hoặc lượng truy cập tự nhiên có phải mục tiêu hiện tại không?", "Khách đang tìm cơ sở qua từ khóa, Maps, mạng xã hội hay OTA?"], allowedClaims: supportingEvidence, prohibitedClaims: fixedProhibited }; }
  return { recommendation: priority.band === "LOW" ? "LOW_PRIORITY" : "DISCOVERY_FIRST", confidence: "LOW", primaryAngle: priority.band === "LOW" ? "Chưa có vấn đề website đủ rõ để chủ động bán; ưu tiên thu thập nhu cầu thật." : "Hỏi nhu cầu và mục tiêu trước khi đề xuất thay đổi website.", supportingEvidence: evidence(opportunities), risks: ["Cơ hội hiện yếu hoặc dữ liệu chưa đủ.", "Dễ tạo ra vấn đề không tồn tại nếu chào bán ngay."], discoveryQuestions: questions, allowedClaims: evidence(opportunities), prohibitedClaims: fixedProhibited };
}
