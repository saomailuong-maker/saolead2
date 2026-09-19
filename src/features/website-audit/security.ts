import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { WebsiteAuditError } from "./types";

export type DnsResolver = (hostname: string) => Promise<Array<{ address: string; family: number }>>;

function ipv4Number(address: string) { return address.split(".").reduce((value, part) => (value << 8) + Number(part), 0) >>> 0; }
function inV4Range(address: string, base: string, bits: number) {
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipv4Number(address) & mask) === (ipv4Number(base) & mask);
}

export function isUnsafeAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return [
    ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
    ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15],
    ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
  ].some(([base, bits]) => inV4Range(address, String(base), Number(bits)));
  if (family === 6) {
    const value = address.toLowerCase().split("%")[0];
    if (value === "::" || value === "::1" || value.startsWith("::ffff:") || value.startsWith("fc") || value.startsWith("fd") || /^fe[89ab]/.test(value) || value.startsWith("ff") || value.startsWith("2001:db8")) return true;
    return false;
  }
  return true;
}

const defaultResolver: DnsResolver = async (hostname) => lookup(hostname, { all: true, verbatim: true });

export async function validatePublicUrl(value: string, resolveDns: DnsResolver = defaultResolver) {
  let url: URL;
  try { url = new URL(value); } catch { throw new WebsiteAuditError("INVALID_URL", "Malformed URL"); }
  if (!(["http:", "https:"] as string[]).includes(url.protocol)) throw new WebsiteAuditError("INVALID_URL", "Unsupported protocol");
  if (url.username || url.password) throw new WebsiteAuditError("INVALID_URL", "Embedded credentials are not allowed");
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost")) throw new WebsiteAuditError("UNSAFE_TARGET", "Local hostname is not allowed");
  let addresses: Array<{ address: string; family: number }>;
  if (isIP(hostname)) addresses = [{ address: hostname, family: isIP(hostname) }];
  else {
    try { addresses = await resolveDns(hostname); } catch { throw new WebsiteAuditError("DNS_ERROR", "DNS resolution failed", { hostname }); }
  }
  if (!addresses.length) throw new WebsiteAuditError("DNS_ERROR", "DNS returned no addresses", { hostname });
  if (addresses.some(({ address }) => isUnsafeAddress(address))) throw new WebsiteAuditError("UNSAFE_TARGET", "Target resolves to a private or reserved address", { hostname });
  url.hostname = hostname;
  return url;
}
