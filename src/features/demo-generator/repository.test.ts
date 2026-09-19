import { describe, expect, it, vi } from "vitest";
import { getPublicDemo } from "./repository";
import { buildDemoBrief, buildDemoContent } from "./brief";
const slug="A".repeat(43); const lead={id:"00000000-0000-4000-8000-000000000001",businessName:"Tiệm Mây",industry:null,locationText:null,websiteUrl:null,phone:null,zaloUrl:null,facebookUrl:null}; const brief=buildDemoBrief(lead,"ONE_PAGE",{opportunities:[],contactReasons:[],auditLimited:false}); const content=buildDemoContent(brief);
const client=(status:string)=>({leadDemo:{findUnique:vi.fn().mockResolvedValue({id:"demo",leadId:lead.id,status,brief,content,preset:"MODERN_MINIMAL"})},publicAuditReport:{findFirst:vi.fn().mockResolvedValue(null)}}) as never;
describe("public demo access",()=>{it("allows a published demo without authentication",async()=>expect((await getPublicDemo(slug,client("PUBLISHED"))).kind).toBe("PUBLISHED"));it.each(["DRAFT","ARCHIVED"])("does not expose %s demos",async(status)=>expect((await getPublicDemo(slug,client(status))).kind).toBe("NOT_FOUND"));it("rejects malformed slugs",async()=>expect((await getPublicDemo("short",client("PUBLISHED"))).kind).toBe("NOT_FOUND"));});
