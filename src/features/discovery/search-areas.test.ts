import { describe, expect, it } from "vitest";
import { GEO_TOLERANCE_METERS, assessLocationQuality, searchAreas } from "./search-areas";

describe("discovery geo quality", () => {
  const area = searchAreas["Đức Trọng"];
  it("accepts Đức Trọng coordinates", () => { expect(assessLocationQuality(area, { latitude: 11.69722, longitude: 108.31611 }, "Đức Trọng, Lâm Đồng")).toMatchObject({ accepted: true, reason: "WITHIN_AREA" }); });
  it("rejects Hà Nội coordinates even when the name could mention Đức Trọng", () => { expect(assessLocationQuality(area, { latitude: 21.0278, longitude: 105.8342 }, "Hà Nội")).toMatchObject({ accepted: false }); });
  it("accepts a result just within the documented tolerance", () => { const edgeLatitude = area.center.latitude + (area.radiusMeters + GEO_TOLERANCE_METERS - 500) / 111_000; expect(assessLocationQuality(area, { latitude: edgeLatitude, longitude: area.center.longitude }, "Lâm Đồng").accepted).toBe(true); });
  it("rejects a result beyond radius and tolerance", () => { const farLatitude = area.center.latitude + (area.radiusMeters + GEO_TOLERANCE_METERS + 5_000) / 111_000; expect(assessLocationQuality(area, { latitude: farLatitude, longitude: area.center.longitude }, "Lâm Đồng")).toMatchObject({ accepted: false, reason: "OUTSIDE_AREA" }); });
  it("accepts missing coordinates only with a clear local address", () => { expect(assessLocationQuality(area, null, "Liên Nghĩa, Đức Trọng, Lâm Đồng")).toEqual({ distanceKm: null, accepted: true, reason: "MISSING_COORDINATES" }); });
  it("rejects missing coordinates with a conflicting address", () => { expect(assessLocationQuality(area, null, "Cầu Giấy, Hà Nội")).toEqual({ distanceKm: null, accepted: false, reason: "ADDRESS_CONFLICT" }); });
});
