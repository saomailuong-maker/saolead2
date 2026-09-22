import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation",()=>({notFound:vi.fn(()=>{throw new Error("NOT_FOUND")})}));
const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("../../../features/demo-generator/repository",()=>({getPublicDemo: mocks.get}));
import { generateMetadata } from "./page";
describe("public demo route",()=>{it("declares noindex/noarchive metadata", async ()=>{mocks.get.mockResolvedValue({ kind: "PUBLISHED", brief: { brand: { businessName: "Test" } } }); const meta = await generateMetadata({ params: Promise.resolve({ publicSlug: "slug-123" }) }); expect(meta.robots).toMatchObject({index:false,follow:false,nocache:true})});});
