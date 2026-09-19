import { db } from "../../lib/db";

type StatusDb = {
  $queryRaw: <T>(query: TemplateStringsArray) => Promise<T>;
  providerRequestLog: { findFirst: (args: object) => Promise<Record<string, unknown> | null> };
  websiteScan: { findFirst: (args: object) => Promise<{ status: string; httpStatus: number | null; createdAt: Date } | null> };
};

export function placesConfigStatus(env: Record<string, string | undefined> = process.env) {
  const transport = env.PLACES_TRANSPORT === "direct-google" ? "direct-google" : "rapidapi";
  const configured = transport === "rapidapi" ? Boolean(env.RAPIDAPI_KEY && env.RAPIDAPI_HOST) : Boolean(env.GOOGLE_MAPS_API_KEY);
  return { transport, configured };
}

export async function getSystemStatus(workspaceId: string, client: StatusDb = db as unknown as StatusDb) {
  const started = performance.now();
  let database: { ok: boolean; responseTimeMs: number };
  try {
    await client.$queryRaw`SELECT 1`;
    database = { ok: true, responseTimeMs: Math.round(performance.now() - started) };
  } catch { database = { ok: false, responseTimeMs: Math.round(performance.now() - started) }; }
  const [providerResult, websiteScanResult] = await Promise.allSettled([
    client.providerRequestLog.findFirst({ where: { workspaceId }, orderBy: { createdAt: "desc" } }),
    client.websiteScan.findFirst({ where: { workspaceId }, orderBy: { createdAt: "desc" }, select: { status: true, httpStatus: true, createdAt: true } }),
  ]);
  const provider = providerResult.status === "fulfilled" ? providerResult.value : null;
  const websiteScan = websiteScanResult.status === "fulfilled" ? websiteScanResult.value : null;
  return { app: { ok: true }, database, places: placesConfigStatus(), provider, websiteScan };
}
