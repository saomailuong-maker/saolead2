import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const db = new PrismaClient();
async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password === "change-this-before-setup" || password.length < 12) throw new Error("Set ADMIN_EMAIL and a unique ADMIN_PASSWORD of at least 12 characters");
  const workspace = await db.workspace.upsert({ where: { slug: "saobeo" }, update: {}, create: { name: "Sao Béo", slug: "saobeo" } });
  const user = await db.user.upsert({ where: { email }, update: { passwordHash: await hash(password, 12) }, create: { email, name: process.env.ADMIN_NAME || "Sao Béo", passwordHash: await hash(password, 12) } });
  await db.workspaceMember.upsert({ where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } }, update: {}, create: { workspaceId: workspace.id, userId: user.id } });
  console.log(`Admin ready: ${email}`);
}
main().finally(() => db.$disconnect());
