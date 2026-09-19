export type BusinessUrlKind = "STANDALONE_WEBSITE" | "SOCIAL_PROFILE" | "EMPTY_OR_INVALID";
export type BusinessUrlClassification = { kind: BusinessUrlKind; url: URL | null; platform: string | null };

const SOCIAL_HOSTS: Array<[string, string]> = [
  ["facebook.com", "Facebook"], ["instagram.com", "Instagram"], ["zalo.me", "Zalo"], ["tiktok.com", "TikTok"],
  ["linkedin.com", "LinkedIn"], ["youtube.com", "YouTube"], ["youtu.be", "YouTube"],
];

function matchesHost(hostname: string, domain: string) { return hostname === domain || hostname.endsWith(`.${domain}`); }

export function classifyBusinessUrl(value: string | null | undefined): BusinessUrlClassification {
  if (!value?.trim()) return { kind: "EMPTY_OR_INVALID", url: null, platform: null };
  let url: URL;
  try { url = new URL(value); } catch { return { kind: "EMPTY_OR_INVALID", url: null, platform: null }; }
  if (url.protocol !== "http:" && url.protocol !== "https:") return { kind: "EMPTY_OR_INVALID", url: null, platform: null };
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  const social = SOCIAL_HOSTS.find(([domain]) => matchesHost(hostname, domain));
  return social ? { kind: "SOCIAL_PROFILE", url, platform: social[1] } : { kind: "STANDALONE_WEBSITE", url, platform: null };
}
