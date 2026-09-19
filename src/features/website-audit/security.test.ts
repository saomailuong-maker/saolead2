import { describe, expect, it } from "vitest";
import { validatePublicUrl } from "./security";

const resolvesTo = (address: string) => async () => [{ address, family: address.includes(":") ? 6 : 4 }];

describe("website audit URL security", () => {
  it("accepts a normal public HTTPS target", async () => { await expect(validatePublicUrl("https://example.com", resolvesTo("93.184.216.34"))).resolves.toMatchObject({ protocol: "https:", hostname: "example.com" }); });
  it.each(["http://localhost", "http://sub.localhost", "http://127.0.0.1", "http://0.1.2.3", "http://10.1.2.3", "http://100.64.0.1", "http://172.16.0.1", "http://172.31.255.255", "http://192.168.1.1", "http://169.254.1.1", "http://224.0.0.1", "http://[::1]", "http://[fc00::1]", "http://[fe80::1]", "http://[::ffff:127.0.0.1]"])("rejects unsafe target %s", async (url) => { await expect(validatePublicUrl(url)).rejects.toMatchObject({ code: "UNSAFE_TARGET" }); });
  it.each(["ftp://example.com", "file:///etc/passwd", "https://user:pass@example.com"])("rejects invalid URL %s", async (url) => { await expect(validatePublicUrl(url, resolvesTo("93.184.216.34"))).rejects.toMatchObject({ code: "INVALID_URL" }); });
  it("rejects a public hostname when any DNS result is private", async () => { const resolver = async () => [{ address: "93.184.216.34", family: 4 }, { address: "10.0.0.1", family: 4 }]; await expect(validatePublicUrl("https://example.com", resolver)).rejects.toMatchObject({ code: "UNSAFE_TARGET" }); });
});
