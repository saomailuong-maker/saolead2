import { describe, expect, it } from "vitest";
import { checkCustomerFacingTone } from "./tone";
import type { SalesDraft } from "./types";

const dm = "Chào anh chị, em có xem qua Mây Homestay và chưa thấy website riêng. Em làm website cho doanh nghiệp địa phương, có vài ý tưởng để khách dễ xem phòng, tiện nghi và vị trí trước khi liên hệ. Nếu tiện, em gửi thử một bản giao diện ngắn để mình tham khảo nhé.";
const email = "Chào anh chị, em có xem qua Mây Homestay và thấy bên mình đang giới thiệu phòng chủ yếu qua Facebook. Em chưa thấy website riêng để khách xem tập trung các loại phòng, tiện nghi, vị trí và thông tin liên hệ. Bên em làm website cho doanh nghiệp địa phương và có vài ý tưởng giúp khách xem thông tin thuận tiện hơn trước khi nhắn hoặc gọi, đồng thời vẫn giữ Facebook và Google Maps là các kênh đang hoạt động. Nếu anh chị tiện, em có thể gửi thử một bản giao diện hoặc audit ngắn để mình tham khảo trước. Nếu thấy phù hợp mình trao đổi tiếp nhé.";
const base: SalesDraft = { recommendation: "WEBSITE_OPPORTUNITY", reasoningSummary: "Có thể thử một lời mời nhẹ.", discoveryQuestions: ["Khách thường hỏi gì trước khi đặt?"], messageVariants: (["NATURAL", "VALUE_FIRST", "DEMO_FIRST"] as const).map((style) => ({ style, zaloFacebookDm: dm, phoneOpener: "Chào anh chị, em có một ý tưởng ngắn cho phần giới thiệu phòng. Em xin phép chia sẻ trong một phút được không?", email })), likelyObjections: [], demoRecommendation: { shouldPrepareDemo: true, reason: "Có thể gửi mockup ngắn.", demoType: "ONE_PAGE" }, claimsUsed: [] };

describe("customer-facing message quality", () => {
  it("accepts three natural channel-specific variants", () => { expect(checkCustomerFacingTone(base)).toEqual({ valid: true, violations: [] }); });
  it.each(["HIGH", "WEBSITE_OPPORTUNITY", "CRM_SOCIAL_URL_ONLY", "MISSING_CONTACT_CTA", "provider", "liên kết hiện tại thuộc nền tảng Facebook"])("rejects internal wording: %s", (phrase) => { const draft = structuredClone(base); draft.messageVariants[0].zaloFacebookDm = `${draft.messageVariants[0].zaloFacebookDm} ${phrase}`; const result = checkCustomerFacingTone(draft); expect(result.valid).toBe(false); expect(result.violations).toContain("NATURAL_INTERNAL_LANGUAGE"); });
  it("keeps detailed discovery questions out of first outreach", () => { const draft = structuredClone(base); draft.messageVariants[0].zaloFacebookDm += " Khách đến từ đâu? Khách thường hỏi gì?"; expect(checkCustomerFacingTone(draft).violations).toContain("NATURAL_TOO_MANY_FIRST_CONTACT_QUESTIONS"); });
});
