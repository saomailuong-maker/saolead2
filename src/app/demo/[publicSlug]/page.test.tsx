import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation",()=>({notFound:vi.fn(()=>{throw new Error("NOT_FOUND")})}));
vi.mock("../../../features/demo-generator/repository",()=>({getPublicDemo:vi.fn()}));
import { metadata } from "./page";
describe("public demo route",()=>{it("declares noindex/noarchive metadata",()=>{expect(metadata.robots).toMatchObject({index:false,follow:false,nocache:true})});});
