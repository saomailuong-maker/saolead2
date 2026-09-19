import { WebsiteAuditError } from "./types";
import { validatePublicUrl, type DnsResolver } from "./security";

const MAX_REDIRECTS = 5;
const MAX_BYTES = 2 * 1024 * 1024;
const REDIRECTS = new Set([301, 302, 303, 307, 308]);

export type FetchHomepageOptions = { request?: typeof fetch; resolveDns?: DnsResolver; timeoutMs?: number; maxBytes?: number };

async function readLimitedBody(response: Response, maximum: number) {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maximum) throw new WebsiteAuditError("RESPONSE_TOO_LARGE", "Response exceeds size limit");
  if (!response.body) return "";
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let total = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    total += value.byteLength;
    if (total > maximum) { await reader.cancel(); throw new WebsiteAuditError("RESPONSE_TOO_LARGE", "Response exceeds size limit"); }
    chunks.push(value);
  }
  const body = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(body);
}

export async function fetchHomepage(requestedUrl: string, options: FetchHomepageOptions = {}) {
  const request = options.request ?? fetch; const timeoutMs = options.timeoutMs ?? 10_000; const maximum = options.maxBytes ?? MAX_BYTES;
  const started = performance.now(); let current = await validatePublicUrl(requestedUrl, options.resolveDns); let redirectCount = 0;
  while (true) {
    const remainingMs = timeoutMs - Math.round(performance.now() - started);
    if (remainingMs <= 0) throw new WebsiteAuditError("TIMEOUT", "Website request timed out");
    let response: Response;
    try {
      response = await request(current, { method: "GET", redirect: "manual", headers: { "User-Agent": "SAOBEO-LEAD WebsiteAudit/1.0", Accept: "text/html,application/xhtml+xml" }, signal: AbortSignal.timeout(remainingMs), cache: "no-store" });
    } catch (error) {
      if (error instanceof WebsiteAuditError) throw error;
      const code = error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError") ? "TIMEOUT" : "FETCH_FAILED";
      throw new WebsiteAuditError(code, "Website request failed", { url: current.toString() });
    }
    if (REDIRECTS.has(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new WebsiteAuditError("HTTP_ERROR", "Redirect has no location", { status: response.status });
      if (redirectCount >= MAX_REDIRECTS) throw new WebsiteAuditError("TOO_MANY_REDIRECTS", "Too many redirects");
      current = await validatePublicUrl(new URL(location, current).toString(), options.resolveDns); redirectCount += 1; continue;
    }
    if (!response.ok) throw new WebsiteAuditError("HTTP_ERROR", "Website returned an HTTP error", { status: response.status, url: current.toString() });
    const contentType = response.headers.get("content-type")?.toLowerCase() || "";
    if (!(contentType.includes("text/html") || contentType.includes("application/xhtml+xml"))) throw new WebsiteAuditError("NON_HTML", "Response is not HTML", { contentType });
    const html = await readLimitedBody(response, maximum);
    return { requestedUrl, finalUrl: current.toString(), httpStatus: response.status, redirectCount, https: current.protocol === "https:", durationMs: Math.round(performance.now() - started), contentType, html };
  }
}
