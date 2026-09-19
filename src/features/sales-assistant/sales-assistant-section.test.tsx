import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const mocks = vi.hoisted(() => ({ generate: vi.fn(), save: vi.fn() }));
vi.mock("./actions", () => ({ generateOutreachDraft: mocks.generate, saveOutreachDraft: mocks.save }));
import { SalesAssistantSection } from "./sales-assistant-section";

const strategy = { recommendation: "LOW_PRIORITY" as const, confidence: "LOW" as const, primaryAngle: "Chưa có vấn đề đủ rõ.", supportingEvidence: [], risks: ["Thiếu dữ liệu"], discoveryQuestions: ["Nguồn khách hiện tại là gì?"], allowedClaims: [], prohibitedClaims: [] };
describe("sales assistant UI", () => {
  it("loads and refreshes without invoking AI", () => { renderToStaticMarkup(<SalesAssistantSection leadId="lead-1" strategy={strategy} draft={null}/>); renderToStaticMarkup(<SalesAssistantSection leadId="lead-1" strategy={strategy} draft={null}/>); expect(mocks.generate).not.toHaveBeenCalled(); expect(mocks.save).not.toHaveBeenCalled(); });
  it("shows the standard Facebook objection without another request", () => { const html = renderToStaticMarkup(<SalesAssistantSection leadId="lead-1" strategy={strategy} draft={null}/>); expect(html).toContain("Nếu Facebook đang mang lại khách"); expect(mocks.generate).not.toHaveBeenCalled(); });
});
