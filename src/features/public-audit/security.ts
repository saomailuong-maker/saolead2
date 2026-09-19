import { createHash, randomBytes } from "node:crypto";

export const createPublicToken = () => randomBytes(32).toString("base64url");
export const viewerHash = (viewerId: string) => createHash("sha256").update(viewerId).digest("hex");
export const isValidPublicToken = (token: string) => /^[A-Za-z0-9_-]{43}$/.test(token);
export const isObviousPreviewBot = (userAgent: string | null) => /bot|crawler|spider|preview|facebookexternalhit|whatsapp|telegram|slackbot|discordbot|linkedinbot/i.test(userAgent || "");
