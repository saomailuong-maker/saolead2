import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { checkDraftClaims } from "./guardrails";
import { SalesAssistantError, salesDraftSchema, type SalesDraft, type SalesStrategy } from "./types";
import { checkCustomerFacingTone } from "./tone";

type ResponsesClient = { responses: { parse: (input: unknown) => Promise<{ output_parsed: unknown }> } };
const instructions = `Bạn là trợ lý soạn bản nháp tiếp cận bán hàng bằng tiếng Việt cho Sao Béo.
Chỉ sử dụng dữ liệu JSON đã cung cấp. Không suy diễn doanh thu, lượng khách, ROI, thứ hạng SEO, tỷ lệ chuyển đổi, hoa hồng OTA hoặc thông tin đối thủ.
Tuân theo salesStrategy, allowedClaims và prohibitedClaims. Website bổ trợ Facebook, Google Maps và OTA; không đề nghị thay thế các kênh đang hoạt động.
Nội dung gửi khách phải nghe như một người làm dịch vụ địa phương, không giống bot audit. Mỗi lời tiếp cận đi theo thứ tự: lời chào tự nhiên; một quan sát cụ thể về doanh nghiệp; một giả thuyết giá trị ngắn; nói rõ Sao Béo cung cấp website/tối ưu website; CTA ít áp lực để gửi audit, demo hoặc mockup và chỉ trao đổi tiếp nếu khách thấy phù hợp.
Không dùng thuật ngữ hệ thống, mã bằng chứng, tên enum, ngôn ngữ provider hoặc cách nói kỹ thuật như “liên kết hiện tại thuộc nền tảng Facebook”. Không dùng “em đang tìm hiểu thông tin của”, “cơ hội website riêng” hoặc “độ tin cậy HIGH”.
Có thể dùng tự nhiên các cụm “em có xem qua…”, “em chưa thấy website riêng…”, “em có vài ý tưởng phù hợp…”, “em có thể gửi thử một bản audit/demo…” và “nếu thấy phù hợp mình trao đổi tiếp”. Không sao chép nguyên một mẫu cố định.
Tạo đúng ba messageVariants: NATURAL thiên về quan hệ, VALUE_FIRST đi thẳng vào giá trị, DEMO_FIRST mời xem bản thử. Mỗi variant có Zalo/Facebook DM 35–70 từ; phone opener gồm 1–2 câu ngắn và một câu hỏi xin phép; email 80–140 từ.
Tin nhắn đầu không hỏi nhiều câu khám phá. Tối đa một câu hỏi rất đơn giản nếu nó thực sự giúp tăng độ phù hợp; các discoveryQuestions chi tiết chỉ dùng sau khi khách phản hồi.
Nếu cơ hội yếu, nói rõ cần khám phá thêm hoặc ưu tiên thấp. Task này chỉ quyết định loại demo; không tạo demo. claimsUsed chỉ được sao chép nguyên văn từ salesStrategy.allowedClaims.`;

export async function generateDraftWithOpenAI(context: unknown, strategy: SalesStrategy, options: { apiKey?: string; model?: string; client?: ResponsesClient } = {}): Promise<{ draft: SalesDraft; model: string }> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY; const model = options.model ?? process.env.OPENAI_MODEL ?? "gpt-5.6-luna";
  if (!apiKey && !options.client) throw new SalesAssistantError("CONFIG", "OpenAI chưa được cấu hình.");
  const client = options.client ?? new OpenAI({ apiKey });
  let parsed: unknown;
  try {
    const response = await client.responses.parse({ model, instructions, input: JSON.stringify(context), text: { format: zodTextFormat(salesDraftSchema, "sales_outreach_draft") }, store: false });
    parsed = response.output_parsed;
  } catch (error) { throw new SalesAssistantError("PROVIDER", error instanceof Error ? `OpenAI không thể tạo bản nháp với model ${model}: ${error.message.slice(0, 240)}` : `OpenAI không thể tạo bản nháp với model ${model}.`); }
  const validated = salesDraftSchema.safeParse(parsed);
  if (!validated.success) throw new SalesAssistantError("MALFORMED_OUTPUT", "OpenAI trả về bản nháp không đúng cấu trúc.");
  if (validated.data.recommendation !== strategy.recommendation) throw new SalesAssistantError("MALFORMED_OUTPUT", "Khuyến nghị AI không khớp chiến lược đã xác minh.");
  const guardrail = checkDraftClaims(validated.data, strategy);
  if (!guardrail.valid) throw new SalesAssistantError("UNSUPPORTED_CLAIMS", `Bản nháp có tuyên bố chưa được dữ liệu hỗ trợ: ${guardrail.violations.join(", ")}`);
  const tone = checkCustomerFacingTone(validated.data);
  if (!tone.valid) throw new SalesAssistantError("MALFORMED_OUTPUT", `Bản nháp chưa đạt yêu cầu giọng điệu/kênh: ${tone.violations.join(", ")}`);
  return { draft: validated.data, model };
}
