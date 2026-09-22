import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { OutreachActionBar } from "./outreach-action-bar";

vi.mock("./actions", () => ({
  recordOutreachSent: vi.fn(),
}));

const mockLead = {
  id: "00000000-0000-4000-8000-000000000001",
  businessName: "Nhà Mây Homestay",
  phone: "0912345678",
  facebookUrl: "https://facebook.com/nhamay",
  industry: "Homestay",
  locationText: "Đà Lạt",
  stage: "NEW",
};

describe("OutreachActionBar", () => {
  it("renders 1-click outreach buttons and message preview", () => {
    const html = renderToStaticMarkup(
      <OutreachActionBar lead={mockLead} publicReportToken="token123" demoSlug="demo456" />
    );
    expect(html).toContain("Công cụ Gửi Bán Tự Động 1-Click");
    expect(html).toContain("Hỏi thăm (Warm-up)");
    expect(html).toContain("Nhắn Zalo 1-Click");
    expect(html).toContain("Messenger");
    expect(html).toContain("Sao chép tin nhắn kèm Link");
    expect(html).toContain("Chép lời chào Kết bạn Zalo");
    expect(html).toContain("Gọi hotline");
    expect(html).toContain("token123");
    expect(html).toContain("demo456");
  });

  it("handles leads without phone gracefully", () => {
    const html = renderToStaticMarkup(
      <OutreachActionBar lead={{ ...mockLead, phone: null }} />
    );
    expect(html).toContain("Công cụ Gửi Bán Tự Động 1-Click");
    expect(html).not.toContain("Gọi hotline");
  });
});
