import { ImageResponse } from "next/og";
import { getPublicReport } from "../../../features/public-audit/repository";
import { classifyReportIndustry } from "../../../features/public-audit/presentation";

export const runtime = "nodejs";
export const alt = "Bản thẩm định marketing & hiện diện online | 3DUA Media";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  let businessName = "Doanh nghiệp địa phương";
  let industry = "Cơ sở kinh doanh";
  let location = "Đà Lạt · Lâm Đồng";
  let isLodging = true;

  try {
    const { token } = await params;
    const access = await getPublicReport(token);
    if (access.kind === "ACTIVE") {
      businessName = access.snapshot.business.name;
      industry = access.snapshot.business.industry || "Cơ sở kinh doanh";
      location = access.snapshot.business.location || "Đà Lạt · Lâm Đồng";
      isLodging = classifyReportIndustry(industry) === "LODGING";
    }
  } catch {
    // Graceful fallback if database or token resolution is delayed
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 80px",
          background: "linear-gradient(135deg, #102a43 0%, #17324d 60%, #243b53 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "12px",
                backgroundColor: "#da8d50",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: "bold",
                color: "#ffffff",
              }}
            >
              3D
            </div>
            <div style={{ fontSize: "22px", fontWeight: "bold", letterSpacing: "2px", color: "#f4c58b" }}>
              3DUA MEDIA
            </div>
          </div>
          <div
            style={{
              padding: "10px 24px",
              borderRadius: "999px",
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              fontSize: "18px",
              color: "#e2e8f0",
              fontWeight: "600",
            }}
          >
            BẢN THẨM ĐỊNH SỐ RIÊNG
          </div>
        </div>

        {/* Center Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1000px" }}>
          <div style={{ fontSize: "22px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.5px" }}>
            {industry} · {location}
          </div>
          <div
            style={{
              fontSize: "60px",
              fontWeight: "bold",
              lineHeight: 1.15,
              color: "#ffffff",
            }}
          >
            {businessName}
          </div>
          <div style={{ fontSize: "28px", color: "#cbd5e1", lineHeight: 1.4, marginTop: "8px" }}>
            {isLodging
              ? "Báo cáo cơ hội chốt khách trực tiếp & tối ưu đặt phòng 1 chạm"
              : "Báo cáo cơ hội hiện diện số & giải pháp tiếp cận khách hàng tiềm năng"}
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div
            style={{
              padding: "12px 24px",
              borderRadius: "16px",
              backgroundColor: "rgba(16, 185, 129, 0.2)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              color: "#6ee7b7",
              fontSize: "20px",
              fontWeight: "600",
            }}
          >
            • Thẩm định Google Maps &amp; 4G
          </div>
          <div
            style={{
              padding: "12px 24px",
              borderRadius: "16px",
              backgroundColor: "rgba(218, 141, 80, 0.2)",
              border: "1px solid rgba(218, 141, 80, 0.4)",
              color: "#fdba74",
              fontSize: "20px",
              fontWeight: "600",
            }}
          >
            • Bản thử giao diện iPhone 16
          </div>
          <div
            style={{
              padding: "12px 24px",
              borderRadius: "16px",
              backgroundColor: "rgba(59, 130, 246, 0.2)",
              border: "1px solid rgba(59, 130, 246, 0.4)",
              color: "#93c5fd",
              fontSize: "20px",
              fontWeight: "600",
            }}
          >
            • Giải pháp chốt cọc 1-chạm
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
