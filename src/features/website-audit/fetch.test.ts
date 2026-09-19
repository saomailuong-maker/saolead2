import { describe, expect, it, vi } from "vitest";
import { fetchHomepage } from "./fetch";

describe("safe homepage fetch", () => {
  it("rejects a redirect to a private IP before making the redirected request", async () => {
    const request = vi.fn<typeof fetch>(async () => new Response(null, { status: 302, headers: { location: "http://127.0.0.1/admin" } }));
    await expect(fetchHomepage("https://example.com", { request: request as typeof fetch, resolveDns: async () => [{ address: "93.184.216.34", family: 4 }] })).rejects.toMatchObject({ code: "UNSAFE_TARGET" });
    expect(request).toHaveBeenCalledTimes(1);
  });
  it("returns only an HTML body and controlled metadata", async () => {
    const request = vi.fn<typeof fetch>(async () => new Response("<html><title>OK</title></html>", { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }));
    await expect(fetchHomepage("https://example.com", { request: request as typeof fetch, resolveDns: async () => [{ address: "93.184.216.34", family: 4 }] })).resolves.toMatchObject({ httpStatus: 200, redirectCount: 0, https: true });
    expect(request.mock.calls[0]?.[1]).toMatchObject({ redirect: "manual", headers: { "User-Agent": "SAOBEO-LEAD WebsiteAudit/1.0" } });
  });
});
