import { COOKIE_NAME } from "@shared/const";
import { createHash, randomBytes } from "node:crypto";
import { notifyOwner } from "./_core/notification";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { acceptCollaboratorInvite, createCollaboratorInvite, createDocumentVersion, getCollaborationAudit, getCollaboratorInvites, getDocumentAccess, getDocumentVersions, regenerateCollaboratorInvite, updateCollaboratorInvite } from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  document: router({
    access: protectedProcedure.input((value: unknown) => {
      if (!value || typeof value !== "object" || typeof (value as { documentId?: unknown }).documentId !== "string") throw new Error("documentId is required");
      return value as { documentId: string };
    }).query(async ({ ctx, input }) => {
      const stored = await getDocumentAccess(input.documentId, ctx.user.id);
      return { documentId: input.documentId, access: stored?.access ?? "write", source: stored ? "server" : "role-fallback", role: ctx.user.role } as const;
    }),
    createVersion: protectedProcedure.input((value: unknown) => {
      if (!value || typeof value !== "object") throw new Error("version payload is required");
      const payload = value as { documentId?: unknown; versionName?: unknown; objectCount?: unknown; stateJson?: unknown };
      if (typeof payload.documentId !== "string" || typeof payload.versionName !== "string") throw new Error("invalid version payload");
      return { documentId: payload.documentId, versionName: payload.versionName.trim().slice(0, 160) || "Untitled version", objectCount: Math.max(0, Number(payload.objectCount) || 0), stateJson: typeof payload.stateJson === "string" ? payload.stateJson : "[]" };
    }).mutation(({ ctx, input }) => createDocumentVersion({ ...input, userId: ctx.user.id })),
    restoreVersion: protectedProcedure.input((value: unknown) => {
      if (!value || typeof value !== "object") throw new Error("version payload is required");
      const payload = value as { documentId?: unknown; versionId?: unknown };
      if (typeof payload.documentId !== "string" || typeof payload.versionId !== "number") throw new Error("invalid restore payload");
      return payload as { documentId: string; versionId: number };
    }).query(async ({ ctx, input }) => (await getDocumentVersions(input.documentId, ctx.user.id)).find((version) => version.id === input.versionId) ?? null),
    versions: protectedProcedure.input((value: unknown) => {
      if (!value || typeof value !== "object" || typeof (value as { documentId?: unknown }).documentId !== "string") throw new Error("documentId is required");
      return value as { documentId: string };
    }).query(({ ctx, input }) => getDocumentVersions(input.documentId, ctx.user.id)),
    invites: protectedProcedure.input((value: unknown) => {
      if (!value || typeof value !== "object" || typeof (value as { documentId?: unknown }).documentId !== "string") throw new Error("documentId is required");
      return value as { documentId: string };
    }).query(({ ctx, input }) => getCollaboratorInvites(input.documentId, ctx.user.id)),
    revokeInvite: protectedProcedure.input((value: unknown) => {
      if (!value || typeof value !== "object") throw new Error("invite payload is required");
      const payload = value as { id?: unknown };
      if (typeof payload.id !== "number") throw new Error("invalid invite id");
      return payload as { id: number };
    }).mutation(({ ctx, input }) => updateCollaboratorInvite({ ...input, ownerUserId: ctx.user.id, status: "revoked" })),
    resendInvite: protectedProcedure.input((value: unknown) => {
      if (!value || typeof value !== "object") throw new Error("invite payload is required");
      const payload = value as { id?: unknown };
      if (typeof payload.id !== "number") throw new Error("invalid invite id");
      return payload as { id: number };
    }).mutation(({ ctx, input }) => updateCollaboratorInvite({ ...input, ownerUserId: ctx.user.id, status: "pending" })),
    acceptInvite: protectedProcedure.input((value: unknown) => {
      if (!value || typeof value !== "object") throw new Error("acceptance payload is required");
      const payload = value as { token?: unknown };
      if (typeof payload.token !== "string" || payload.token.length < 32) throw new Error("invalid invite token");
      return payload as { token: string };
    }).mutation(async ({ ctx, input }) => {
      if (!ctx.user.email) throw new Error("A signed-in email is required to accept this invitation");
      const tokenHash = createHash("sha256").update(input.token).digest("hex");
      return acceptCollaboratorInvite({ tokenHash, userId: ctx.user.id, userEmail: ctx.user.email });
    }),
    invite: protectedProcedure.input((value: unknown) => {
      if (!value || typeof value !== "object") throw new Error("invite payload is required");
      const payload = value as { documentId?: unknown; inviteeEmail?: unknown; access?: unknown; origin?: unknown };
      if (typeof payload.documentId !== "string" || typeof payload.inviteeEmail !== "string" || !["read", "write"].includes(String(payload.access))) throw new Error("invalid invite payload");
      return { documentId: payload.documentId, inviteeEmail: payload.inviteeEmail.trim().toLowerCase(), access: payload.access as "read" | "write", origin: typeof payload.origin === "string" ? payload.origin : "" };
    }).mutation(async ({ ctx, input }) => { const token = randomBytes(32).toString("hex"); const tokenHash = createHash("sha256").update(token).digest("hex"); const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); const invite = await createCollaboratorInvite({ documentId: input.documentId, inviteeEmail: input.inviteeEmail, access: input.access, tokenHash, expiresAt, ownerUserId: ctx.user.id }); if (invite) await notifyOwner({ title: "VectorForge collaborator invitation", content: `${ctx.user.email ?? "A collaborator"} invited ${invite.inviteeEmail} with ${invite.access} access.` }); const origin = input.origin.replace(/\/$/, ""); return { invite, inviteUrl: `${origin || ""}/?invite=${token}` };     }),
    regenerateInvite: protectedProcedure.input((value: unknown) => { const payload = value as { id?: unknown; origin?: unknown }; if (typeof payload.id !== "number") throw new Error("invalid invite id"); return { id: payload.id, origin: typeof payload.origin === "string" ? payload.origin : "" }; }).mutation(async ({ ctx, input }) => { const token = randomBytes(32).toString("hex"); const invite = await regenerateCollaboratorInvite({ id: input.id, ownerUserId: ctx.user.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }); return { invite, inviteUrl: `${input.origin.replace(/\/$/, "")}/?invite=${token}` }; }),
    audit: protectedProcedure.input((value: unknown) => { const payload = value as { documentId?: unknown; query?: unknown; from?: unknown; to?: unknown }; if (typeof payload.documentId !== "string") throw new Error("invalid document id"); return { documentId: payload.documentId, query: typeof payload.query === "string" ? payload.query : "", from: typeof payload.from === "string" ? new Date(payload.from) : undefined, to: typeof payload.to === "string" ? new Date(payload.to) : undefined }; }).query(({ ctx, input }) => getCollaborationAudit(input.documentId, ctx.user.id, input.query, input.from, input.to)),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
