import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findLead: vi.fn(), createScan: vi.fn(), updateScan: vi.fn(), audit: vi.fn(), revalidate: vi.fn() }));
vi.mock("../../lib/auth", () => ({ requireActor: async () => ({ workspaceId: "workspace-1", user: { id: "user-1" } }) }));
vi.mock("../../lib/db", () => ({ db: { lead: { findFirst: mocks.findLead }, websiteScan: { create: mocks.createScan, update: mocks.updateScan } } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
vi.mock("./audit", () => ({ auditWebsite: mocks.audit }));

import { runWebsiteAudit } from "./actions";
import { WebsiteAuditError } from "./types";
const form = () => { const value = new FormData(); value.set("leadId", "00000000-0000-4000-8000-000000000001"); return value; };

describe("website audit action", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.findLead.mockResolvedValue({ id: "00000000-0000-4000-8000-000000000001", websiteUrl: "https://example.com" }); mocks.createScan.mockResolvedValue({ id: "scan-1" }); });
  it("saves a successful scan for a lead in the current workspace", async () => {
    mocks.audit.mockResolvedValue({ checks: { reachability: { finalUrl: "https://example.com/", httpStatus: 200, durationMs: 25, redirectCount: 0 } }, findings: [] });
    await expect(runWebsiteAudit(form())).rejects.toThrow("redirect:/leads/00000000-0000-4000-8000-000000000001?audit=complete");
    expect(mocks.findLead).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ workspaceId: "workspace-1" }) }));
    expect(mocks.updateScan).toHaveBeenCalledWith({ where: { id: "scan-1" }, data: expect.objectContaining({ status: "SUCCESS", httpStatus: 200, findings: [] }) });
  });
  it("saves a controlled failure", async () => {
    mocks.audit.mockRejectedValue(new WebsiteAuditError("UNSAFE_TARGET", "blocked"));
    await expect(runWebsiteAudit(form())).rejects.toThrow("redirect:/leads/00000000-0000-4000-8000-000000000001?auditError=UNSAFE_TARGET");
    expect(mocks.updateScan).toHaveBeenCalledWith({ where: { id: "scan-1" }, data: expect.objectContaining({ status: "FAILED", errorCode: "UNSAFE_TARGET" }) });
  });
  it("prevents an audit for a known social-platform URL", async () => { mocks.findLead.mockResolvedValue({ id: "00000000-0000-4000-8000-000000000001", websiteUrl: "https://m.facebook.com/example" }); await expect(runWebsiteAudit(form())).rejects.toThrow("redirect:/leads/00000000-0000-4000-8000-000000000001?auditError=SOCIAL_PROFILE"); expect(mocks.createScan).not.toHaveBeenCalled(); expect(mocks.audit).not.toHaveBeenCalled(); });
});
