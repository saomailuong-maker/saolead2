export type FindingSeverity = "HIGH" | "MEDIUM" | "LOW";
export type AuditFinding = { severity: FindingSeverity; code: string; title: string; evidence?: string };

export type AuditChecks = {
  reachability: { requestedUrl: string; finalUrl: string; httpStatus: number; redirectCount: number; https: boolean; durationMs: number; contentType: string };
  seo: { title: string | null; description: string | null; viewport: string | null; canonical: string | null; lang: string | null; h1Count: number; openGraphTitle: string | null; openGraphDescription: string | null; favicon: string | null; robots: string | null };
  contact: { telLinks: number; mailtoLinks: number; forms: number; zalo: boolean; messenger: boolean; whatsapp: boolean; facebook: boolean; instagram: boolean; ctas: string[] };
  structure: Record<"about" | "services" | "products" | "contact" | "blog" | "faq" | "portfolio" | "booking", boolean>;
};

export type AuditResult = { checks: AuditChecks; findings: AuditFinding[] };
export type AuditErrorCode = "INVALID_URL" | "UNSAFE_TARGET" | "DNS_ERROR" | "TIMEOUT" | "TOO_MANY_REDIRECTS" | "HTTP_ERROR" | "NON_HTML" | "RESPONSE_TOO_LARGE" | "FETCH_FAILED" | "PARSE_FAILED";

export class WebsiteAuditError extends Error {
  constructor(public readonly code: AuditErrorCode, message: string, public readonly context: Record<string, unknown> = {}) { super(message); this.name = "WebsiteAuditError"; }
}
