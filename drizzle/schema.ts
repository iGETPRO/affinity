import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TODO: Add your tables here

export const documentAccess = mysqlTable("document_access", {
  id: int("id").autoincrement().primaryKey(),
  documentId: varchar("documentId", { length: 128 }).notNull(),
  userId: int("userId").notNull(),
  access: mysqlEnum("access", ["read", "write"]).default("write").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentAccess = typeof documentAccess.$inferSelect;

export const documentVersions = mysqlTable("document_versions", {
  id: int("id").autoincrement().primaryKey(),
  documentId: varchar("documentId", { length: 128 }).notNull(),
  userId: int("userId").notNull(),
  versionName: varchar("versionName", { length: 160 }).notNull(),
  objectCount: int("objectCount").default(0).notNull(),
  stateJson: text("stateJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentVersion = typeof documentVersions.$inferSelect;

export const collaboratorInvites = mysqlTable("collaborator_invites", {
  id: int("id").autoincrement().primaryKey(),
  documentId: varchar("documentId", { length: 128 }).notNull(),
  ownerUserId: int("ownerUserId").notNull(),
  inviteeEmail: varchar("inviteeEmail", { length: 320 }).notNull(),
  access: mysqlEnum("access", ["read", "write"]).default("read").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "revoked"]).default("pending").notNull(),
  tokenHash: varchar("tokenHash", { length: 128 }).default("").notNull().unique(),
  acceptedAt: timestamp("acceptedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CollaboratorInvite = typeof collaboratorInvites.$inferSelect;

export const collaborationAudit = mysqlTable("collaboration_audit", {
  id: int("id").autoincrement().primaryKey(),
  documentId: varchar("documentId", { length: 128 }).notNull(),
  actorUserId: int("actorUserId").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  targetId: varchar("targetId", { length: 128 }),
  detail: text("detail"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CollaborationAudit = typeof collaborationAudit.$inferSelect;
