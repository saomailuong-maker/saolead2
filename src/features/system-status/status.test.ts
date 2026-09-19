import { describe, expect, it, vi } from "vitest";
import { getSystemStatus, openAIConfigStatus, placesConfigStatus } from "./status";

function client(query: () => Promise<unknown>) { return { $queryRaw: query, providerRequestLog: { findFirst: vi.fn().mockResolvedValue(null) }, websiteScan: { findFirst: vi.fn().mockResolvedValue(null) }, outreachDraft: { findFirst: vi.fn().mockResolvedValue(null) } }; }

describe("system status", () => {
  it("reports database health success", async () => { const result = await getSystemStatus("workspace-1", client(async () => [{ ok: 1 }]) as never); expect(result.database.ok).toBe(true); });
  it("reports database health failure without throwing", async () => { const result = await getSystemStatus("workspace-1", client(async () => { throw new Error("db failed"); }) as never); expect(result.database.ok).toBe(false); });
  it("returns config presence without exposing secrets", () => { const result = placesConfigStatus({ PLACES_TRANSPORT: "rapidapi", RAPIDAPI_KEY: "secret-key", RAPIDAPI_HOST: "secret-host" }); expect(result).toEqual({ transport: "rapidapi", configured: true }); expect(JSON.stringify(result)).not.toContain("secret"); });
  it("reports OpenAI configuration without returning the key", () => { const result = openAIConfigStatus({ OPENAI_API_KEY: "secret-openai", OPENAI_MODEL: "gpt-5.6-luna" }); expect(result).toEqual({ configured: true, model: "gpt-5.6-luna" }); expect(JSON.stringify(result)).not.toContain("secret-openai"); });
});
