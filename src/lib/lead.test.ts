import { describe, expect, it } from "vitest";
import { normalizeName } from "./lead";
describe("normalizeName", () => { it("normalizes Vietnamese business names", () => { expect(normalizeName("  Cà Phê  Đà Lạt ")).toBe("ca phe da lat"); }); });
