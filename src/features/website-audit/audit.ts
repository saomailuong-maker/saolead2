import { fetchHomepage, type FetchHomepageOptions } from "./fetch";
import { generateFindings } from "./findings";
import { parseHomepage } from "./parser";
import { WebsiteAuditError, type AuditResult } from "./types";

export async function auditWebsite(url: string, options: FetchHomepageOptions = {}): Promise<AuditResult> {
  const page = await fetchHomepage(url, options);
  try {
    const parsed = parseHomepage(page.html);
    const checks = { reachability: { requestedUrl: page.requestedUrl, finalUrl: page.finalUrl, httpStatus: page.httpStatus, redirectCount: page.redirectCount, https: page.https, durationMs: page.durationMs, contentType: page.contentType }, ...parsed };
    return { checks, findings: generateFindings(checks) };
  } catch (error) {
    if (error instanceof WebsiteAuditError) throw error;
    throw new WebsiteAuditError("PARSE_FAILED", "Could not parse website HTML");
  }
}
