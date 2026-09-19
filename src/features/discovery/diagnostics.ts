import { z } from "zod";
import type { ProviderDiagnostics, ProviderErrorKind, ProviderQuotaSnapshot } from "./provider";

const metricSchema = z.object({ limit: z.string().nullable(), remaining: z.string().nullable(), reset: z.string().nullable() });
export const providerDiagnosticsSchema = z.object({
  transport: z.enum(["rapidapi", "direct-google"]), operation: z.enum(["text_search", "details"]), status: z.enum(["SUCCESS", "ERROR"]),
  errorKind: z.enum(["CONFIG", "BAD_REQUEST", "AUTH", "QUOTA", "TIMEOUT", "NETWORK", "PROVIDER", "MALFORMED_RESPONSE"]).nullable(),
  httpStatus: z.number().int().nullable(), providerCode: z.string().nullable(), providerMessage: z.string().nullable(), durationMs: z.number().int().nullable(),
  quota: z.object({ requests: metricSchema.optional(), generic: metricSchema.optional(), rapidFreePlansHardLimit: metricSchema.optional() }).nullable(),
});

export function diagnosticsFromError(error: unknown): ProviderDiagnostics {
  if (error && typeof error === "object" && "kind" in error && "transport" in error) {
    const value = error as { transport: ProviderDiagnostics["transport"]; operation: ProviderDiagnostics["operation"]; kind: ProviderErrorKind; httpStatus: number | null; providerCode: string | null; providerMessage: string | null; durationMs: number; quota: ProviderQuotaSnapshot | null };
    return { transport: value.transport, operation: value.operation, status: "ERROR", errorKind: value.kind, httpStatus: value.httpStatus, providerCode: value.providerCode, providerMessage: value.providerMessage, durationMs: value.durationMs, quota: value.quota };
  }
  if (error instanceof Error && error.name === "PlacesConfigError") {
    const transport = "transport" in error && error.transport === "direct-google" ? "direct-google" : "rapidapi";
    return { transport, operation: "text_search", status: "ERROR", errorKind: "CONFIG", httpStatus: null, providerCode: "CONFIG_ERROR", providerMessage: "Places API configuration is incomplete", durationMs: null, quota: null };
  }
  return { transport: "rapidapi", operation: "text_search", status: "ERROR", errorKind: "PROVIDER", httpStatus: null, providerCode: "UNKNOWN", providerMessage: "Unexpected provider failure", durationMs: null, quota: null };
}

export function diagnosticsMessage(diagnostics: ProviderDiagnostics) {
  switch (diagnostics.errorKind) {
    case "BAD_REQUEST": return "Yêu cầu tìm kiếm chưa hợp lệ với Places API. HTTP 400.";
    case "AUTH": return "RapidAPI từ chối xác thực/quyền truy cập.";
    case "QUOTA": return "Đã chạm giới hạn request của RapidAPI.";
    case "TIMEOUT": case "NETWORK": return "Places API phản hồi quá chậm hoặc mất kết nối.";
    case "CONFIG": return "Places API chưa được cấu hình đầy đủ.";
    default: return "Không thể tìm doanh nghiệp lúc này. Vui lòng thử lại.";
  }
}

export function preferredQuota(quota: ProviderQuotaSnapshot | null) {
  return quota?.rapidFreePlansHardLimit ?? quota?.requests ?? quota?.generic ?? null;
}
