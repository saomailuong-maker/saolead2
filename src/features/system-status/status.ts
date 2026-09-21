import { db } from "../../lib/db";

type StatusDb = {
  $queryRaw: <T>(query: TemplateStringsArray) => Promise<T>;
  providerRequestLog: { findFirst: (args: object) => Promise<Record<string, unknown> | null> };
  websiteScan: { findFirst: (args: object) => Promise<{ status: string; httpStatus: number | null; createdAt: Date } | null> };
  outreachDraft: { findFirst: (args: object) => Promise<{ status: string; model: string; createdAt: Date } | null> };
  leadDemo: { findFirst: (args: object) => Promise<{ conceptStatus: string | null; conceptModel: string | null; conceptHttpStatus: number | null; conceptGeneratedAt: Date | null } | null> };
};

export function placesConfigStatus(env: Record<string, string | undefined> = process.env) {
  const transport = env.PLACES_TRANSPORT === "direct-google" ? "direct-google" : "rapidapi";
  const configured = transport === "rapidapi" ? Boolean(env.RAPIDAPI_KEY && env.RAPIDAPI_HOST) : Boolean(env.GOOGLE_MAPS_API_KEY);
  return { transport, configured };
}
export function openAIConfigStatus(env: Record<string, string | undefined> = process.env) { return { configured: Boolean(env.OPENAI_API_KEY), model: env.OPENAI_MODEL || "gpt-5.6-luna" }; }
export function openAIImageConfigStatus(env: Record<string,string|undefined>=process.env){return{configured:Boolean(env.OPENAI_API_KEY),model:env.OPENAI_IMAGE_MODEL||"gpt-image-2.5-flare"}}

export async function getSystemStatus(workspaceId: string, client: StatusDb = db as unknown as StatusDb) {
  const started = performance.now();
  let database: { ok: boolean; responseTimeMs: number };
  try {
    await client.$queryRaw`SELECT 1`;
    database = { ok: true, responseTimeMs: Math.round(performance.now() - started) };
  } catch { database = { ok: false, responseTimeMs: Math.round(performance.now() - started) }; }
  const [providerResult, websiteScanResult, outreachResult, imageResult] = await Promise.allSettled([
    client.providerRequestLog.findFirst({ where: { workspaceId }, orderBy: { createdAt: "desc" } }),
    client.websiteScan.findFirst({ where: { workspaceId }, orderBy: { createdAt: "desc" }, select: { status: true, httpStatus: true, createdAt: true } }),
    client.outreachDraft.findFirst({ where: { workspaceId }, orderBy: { createdAt: "desc" }, select: { status: true, model: true, createdAt: true } }),
    client.leadDemo.findFirst({ where: { workspaceId, conceptStatus: { not: null } }, orderBy: { updatedAt: "desc" }, select: { conceptStatus: true, conceptModel: true, conceptHttpStatus: true, conceptGeneratedAt: true } }),
  ]);
  const provider = providerResult.status === "fulfilled" ? providerResult.value : null;
  const websiteScan = websiteScanResult.status === "fulfilled" ? websiteScanResult.value : null;
  const outreachDraft = outreachResult.status === "fulfilled" ? outreachResult.value : null;
  const imageGeneration = imageResult.status === "fulfilled" ? imageResult.value : null;
  return { app: { ok: true }, database, places: placesConfigStatus(), openAI: openAIConfigStatus(), openAIImage: openAIImageConfigStatus(), provider, websiteScan, outreachDraft, imageGeneration };
}
