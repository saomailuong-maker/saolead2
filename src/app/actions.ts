"use server";

import { compare } from "bcryptjs";
import { ActivityType, Stage, TaskPriority, TaskStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, requireActor } from "../lib/auth";
import { db } from "../lib/db";
import { normalizeName } from "../lib/lead";

const field = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const optional = (form: FormData, key: string) => field(form, key) || null;

export async function login(form: FormData) {
  const email = field(form, "email").toLowerCase();
  const password = field(form, "password");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await compare(password, user.passwordHash))) redirect("/login?error=1");
  await createSession(user.id);
  redirect("/");
}

export async function logout() { await destroySession(); redirect("/login"); }

export async function createLead(form: FormData) {
  const actor = await requireActor();
  const businessName = z.string().min(2).max(200).parse(field(form, "businessName"));
  const lead = await db.lead.create({ data: { workspaceId: actor.workspaceId, ownerUserId: actor.user.id, businessName, businessNameNormalized: normalizeName(businessName), industry: optional(form, "industry"), locationText: optional(form, "locationText"), phone: optional(form, "phone"), email: optional(form, "email"), websiteUrl: optional(form, "websiteUrl"), notes: optional(form, "notes") } });
  revalidatePath("/");
  redirect(`/leads/${lead.id}`);
}

export async function updateLead(form: FormData) {
  const actor = await requireActor();
  const id = field(form, "id");
  const businessName = z.string().min(2).max(200).parse(field(form, "businessName"));
  await db.lead.updateMany({ where: { id, workspaceId: actor.workspaceId, archivedAt: null }, data: { businessName, businessNameNormalized: normalizeName(businessName), industry: optional(form, "industry"), locationText: optional(form, "locationText"), phone: optional(form, "phone"), email: optional(form, "email"), websiteUrl: optional(form, "websiteUrl"), notes: optional(form, "notes") } });
  revalidatePath(`/leads/${id}`);
  revalidatePath("/leads");
}

export async function archiveLead(form: FormData) {
  const actor = await requireActor();
  await db.lead.updateMany({ where: { id: field(form, "id"), workspaceId: actor.workspaceId }, data: { archivedAt: new Date() } });
  revalidatePath("/leads");
  redirect("/leads");
}

export async function changeStage(form: FormData) {
  const actor = await requireActor();
  const id = field(form, "id");
  const stage = z.nativeEnum(Stage).parse(field(form, "stage"));
  await db.$transaction(async (tx) => {
    const lead = await tx.lead.findFirst({ where: { id, workspaceId: actor.workspaceId, archivedAt: null } });
    if (!lead || lead.stage === stage) return;
    await tx.lead.update({ where: { id }, data: { stage } });
    await tx.activity.create({ data: { leadId: id, userId: actor.user.id, type: ActivityType.STATUS_CHANGED, summary: `${lead.stage} → ${stage}` } });
  });
  revalidatePath("/pipeline"); revalidatePath(`/leads/${id}`); revalidatePath("/leads");
}

export async function addActivity(form: FormData) {
  const actor = await requireActor();
  const leadId = field(form, "leadId");
  const lead = await db.lead.findFirst({ where: { id: leadId, workspaceId: actor.workspaceId, archivedAt: null }, select: { id: true } });
  if (!lead) return;
  const summary = z.string().min(1).max(2000).parse(field(form, "summary"));
  const type = z.nativeEnum(ActivityType).parse(field(form, "type"));
  await db.activity.create({ data: { leadId, userId: actor.user.id, type, summary } });
  revalidatePath(`/leads/${leadId}`);
}

export async function createTask(form: FormData) {
  const actor = await requireActor();
  const leadId = field(form, "leadId");
  const lead = await db.lead.findFirst({ where: { id: leadId, workspaceId: actor.workspaceId, archivedAt: null }, select: { id: true } });
  if (!lead) return;
  const title = z.string().min(2).max(200).parse(field(form, "title"));
  const dueAt = z.coerce.date().parse(field(form, "dueAt"));
  const priority = z.nativeEnum(TaskPriority).parse(field(form, "priority") || "MEDIUM");
  await db.task.create({ data: { leadId, title, dueAt, priority, assignedToId: actor.user.id } });
  revalidatePath("/tasks"); revalidatePath(`/leads/${leadId}`);
}

export async function updateTask(form: FormData) {
  const actor = await requireActor();
  const id = field(form, "id");
  const status = z.nativeEnum(TaskStatus).parse(field(form, "status"));
  const task = await db.task.findFirst({ where: { id, lead: { workspaceId: actor.workspaceId } } });
  if (!task) return;
  await db.$transaction(async (tx) => {
    await tx.task.update({ where: { id }, data: { status } });
    if (status === "DONE" && task.status !== "DONE") await tx.activity.create({ data: { leadId: task.leadId, userId: actor.user.id, type: "TASK_COMPLETED", summary: task.title } });
  });
  revalidatePath("/tasks"); revalidatePath(`/leads/${task.leadId}`);
}
