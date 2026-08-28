import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { CollaboratorInvite, CollaborationAudit, DocumentAccess, DocumentVersion, InsertUser, collaborationAudit, collaboratorInvites, documentAccess, documentVersions, users } from "../drizzle/schema";
import { ENV } from './_core/env';
import { formatAuditAction, isInviteExpired, normalizeInviteEmail, retainLatestVersions } from "../shared/collaboration";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getDocumentAccess(documentId: string, userId: number): Promise<DocumentAccess | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(documentAccess).where(eq(documentAccess.documentId, documentId)).limit(1);
  return result.find((row) => row.userId === userId);
}

export async function getDocumentVersions(documentId: string, userId: number): Promise<DocumentVersion[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documentVersions).where(eq(documentVersions.documentId, documentId)).then((rows) => rows.filter((row) => row.userId === userId).slice(0, 12));
}

export async function recordCollaborationAudit(input: { documentId: string; actorUserId: number; action: string; targetId?: string; detail?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(collaborationAudit).values(input);
}

export async function createCollaboratorInvite(input: { documentId: string; ownerUserId: number; inviteeEmail: string; access: "read" | "write"; tokenHash: string; expiresAt: Date }): Promise<CollaboratorInvite | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(collaboratorInvites).values({ ...input, inviteeEmail: normalizeInviteEmail(input.inviteeEmail) });
  await recordCollaborationAudit({ documentId: input.documentId, actorUserId: input.ownerUserId, action: "invite.created", detail: formatAuditAction("invite.created", `${input.inviteeEmail}:${input.access}`) });
  const rows = await db.select().from(collaboratorInvites).where(eq(collaboratorInvites.ownerUserId, input.ownerUserId));
  return rows.find((row) => row.documentId === input.documentId && row.inviteeEmail === normalizeInviteEmail(input.inviteeEmail) && row.status === "pending");
}

export async function createDocumentVersion(input: { documentId: string; userId: number; versionName: string; objectCount: number; stateJson: string }): Promise<DocumentVersion | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(documentVersions).values(input);
  await recordCollaborationAudit({ documentId: input.documentId, actorUserId: input.userId, action: "version.captured", detail: input.versionName });
  const rows = await db.select().from(documentVersions).where(eq(documentVersions.documentId, input.documentId));
  const owned = retainLatestVersions(rows.filter((row) => row.userId === input.userId));
  for (const stale of rows.filter((row) => row.userId === input.userId && !owned.some((item) => item.id === row.id))) await db.delete(documentVersions).where(eq(documentVersions.id, stale.id));
  return owned[0];
}

export async function acceptCollaboratorInvite(input: { tokenHash: string; userId: number; userEmail: string }): Promise<CollaboratorInvite | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(collaboratorInvites);
  const invite = rows.find((row) => row.tokenHash === input.tokenHash && row.status === "pending" && !isInviteExpired(row.expiresAt) && normalizeInviteEmail(row.inviteeEmail) === normalizeInviteEmail(input.userEmail));
  if (!invite) return undefined;
  await db.update(collaboratorInvites).set({ status: "accepted", acceptedAt: new Date() }).where(eq(collaboratorInvites.id, invite.id));
  await recordCollaborationAudit({ documentId: invite.documentId, actorUserId: input.userId, action: "invite.accepted", targetId: String(invite.id), detail: invite.inviteeEmail });
  await db.insert(documentAccess).values({ documentId: invite.documentId, userId: input.userId, access: invite.access });
  return { ...invite, status: "accepted", acceptedAt: new Date() };
}

export async function regenerateCollaboratorInvite(input: { id: number; ownerUserId: number; tokenHash: string; expiresAt: Date }) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(collaboratorInvites).where(eq(collaboratorInvites.ownerUserId, input.ownerUserId));
  const existing = rows.find((row) => row.id === input.id);
  if (!existing) return undefined;
  await db.update(collaboratorInvites).set({ tokenHash: input.tokenHash, expiresAt: input.expiresAt, status: "pending" }).where(eq(collaboratorInvites.id, input.id));
  await recordCollaborationAudit({ documentId: existing.documentId, actorUserId: input.ownerUserId, action: "invite.regenerated", targetId: String(input.id), detail: existing.inviteeEmail });
  return { ...existing, tokenHash: input.tokenHash, expiresAt: input.expiresAt, status: "pending" as const };
}

export async function getCollaborationAudit(documentId: string, actorUserId: number, query = "", from?: Date, to?: Date): Promise<CollaborationAudit[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(collaborationAudit).where(eq(collaborationAudit.documentId, documentId));
  const needle = query.trim().toLowerCase();
  return rows.filter((row) => row.actorUserId === actorUserId && (!needle || `${row.action} ${row.detail ?? ""}`.toLowerCase().includes(needle)) && (!from || row.createdAt >= from) && (!to || row.createdAt <= to)).sort((a, b) => b.id - a.id).slice(0, 50);
}

export async function updateCollaboratorInvite(input: { id: number; ownerUserId: number; status: "pending" | "revoked" }): Promise<CollaboratorInvite | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(collaboratorInvites).where(eq(collaboratorInvites.ownerUserId, input.ownerUserId));
  const existing = rows.find((row) => row.id === input.id);
  if (!existing) return undefined;
  await db.update(collaboratorInvites).set({ status: input.status }).where(eq(collaboratorInvites.id, input.id));
  await recordCollaborationAudit({ documentId: existing.documentId, actorUserId: input.ownerUserId, action: input.status === "revoked" ? "invite.revoked" : "invite.resent", targetId: String(input.id), detail: existing.inviteeEmail });
  return { ...existing, status: input.status };
}

export async function getCollaboratorInvites(documentId: string, ownerUserId: number): Promise<CollaboratorInvite[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(collaboratorInvites).where(eq(collaboratorInvites.ownerUserId, ownerUserId));
  return rows.filter((row) => row.documentId === documentId).slice(0, 24);
}

// TODO: add feature queries here as your schema grows.
