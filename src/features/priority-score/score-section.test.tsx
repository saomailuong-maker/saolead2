import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PriorityScoreSection } from "./score-section";

describe("priority score detail UI", () => {
  it("renders total, band, breakdown and reasons", () => {
    const html = renderToStaticMarkup(<PriorityScoreSection score={{ total: 47, band: "WARM", contactability: 12, opportunity: 30, readiness: 5, opportunityIncomplete: false, reasons: [{ code: "CONTACT_PHONE", label: "Có số điện thoại", points: 12, group: "CONTACTABILITY" }] }}/>);
    expect(html).toContain("Điểm ưu tiên"); expect(html).toContain("47"); expect(html).toContain("WARM"); expect(html).toContain("12/25"); expect(html).toContain("30/50"); expect(html).toContain("5/25"); expect(html).toContain("Có số điện thoại");
  });
});
