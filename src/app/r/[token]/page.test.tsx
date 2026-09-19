import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("../../../features/public-audit/repository", () => ({ getPublicReport: mocks.get }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("not-found"); } }));
import PublicAuditReportPage, { metadata } from "./page";

const snapshot = { version: 1 as const, business: { name: "Mây Homestay", industry: "Homestay", location: "Đà Lạt" }, reportType: "SOCIAL_ONLY" as const, summary: { headline: "Thông tin tập trung hơn", intro: "Một vài quan sát ban đầu." }, observations: [{ title: "Chưa phát hiện website riêng", detail: "Hiện đã có Facebook và Google Maps." }], opportunities: [{ title: "Gom thông tin", detail: "Giúp khách xem thuận tiện." }], recommendations: [{ title: "Landing page", detail: "Bắt đầu gọn nhẹ." }], cta: { title: "Bước tiếp theo", detail: "Có thể xem một bản thử trước." }, generatedAt: "2026-09-19T00:00:00.000Z" };
describe("public audit page", () => {
  it("renders an active report without login, admin navigation or a broken demo link", async () => { mocks.get.mockResolvedValue({ kind: "ACTIVE", reportId: "report-1", snapshot, demoSlug: null }); const html = renderToStaticMarkup(await PublicAuditReportPage({ params: Promise.resolve({ token: "a".repeat(43) }) })); expect(html).toContain("Mây Homestay"); expect(html).toContain("Chưa phát hiện website riêng"); expect(html).toContain("Giá trị có thể nhận được"); expect(html).not.toContain("/demo/"); expect(html).not.toContain("SAOBEO LEAD"); expect(html).not.toContain("Pipeline"); });
  it("links to the published demo when one is available", async () => { mocks.get.mockResolvedValue({ kind: "ACTIVE", reportId: "report-1", snapshot, demoSlug: "d".repeat(43) }); const html = renderToStaticMarkup(await PublicAuditReportPage({ params: Promise.resolve({ token: "a".repeat(43) }) })); expect(html).toContain(`/demo/${"d".repeat(43)}`); expect(html).toContain("Xem demo đề xuất"); });
  it("does not reveal business details after revoke", async () => { mocks.get.mockResolvedValue({ kind: "REVOKED" }); const html = renderToStaticMarkup(await PublicAuditReportPage({ params: Promise.resolve({ token: "a".repeat(43) }) })); expect(html).toContain("không còn khả dụng"); expect(html).not.toContain("Mây Homestay"); });
  it("declares noindex metadata", () => { expect(metadata.robots).toMatchObject({ index: false, follow: false, nocache: true }); });
});
