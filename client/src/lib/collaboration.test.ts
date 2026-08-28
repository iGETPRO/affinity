import { describe, expect, it } from "vitest";
import { formatAuditAction, isInviteExpired, normalizeInviteEmail, parseVersionState, retainLatestVersions } from "@shared/collaboration";

describe("collaboration helpers", () => {
  it("normalizes invite emails", () => expect(normalizeInviteEmail("  Designer@Example.COM ")).toBe("designer@example.com"));
  it("retains the latest twelve versions", () => {
    const retained = retainLatestVersions(Array.from({ length: 14 }, (_, index) => ({ id: index + 1 })));
    expect(retained).toHaveLength(12);
    expect(retained[0].id).toBe(14);
    expect(retained.at(-1)?.id).toBe(3);
  });
  it("detects expired and active invite boundaries", () => {
    const now = Date.parse("2026-08-24T12:00:00.000Z");
    expect(isInviteExpired("2026-08-24T11:59:59.000Z", now)).toBe(true);
    expect(isInviteExpired("2026-08-24T12:00:01.000Z", now)).toBe(false);
  });
  it("formats audit action labels", () => expect(formatAuditAction("invite.regenerated", "peer@example.com")).toBe("invite.regenerated · peer@example.com"));
  it("rejects malformed version state without throwing", () => {
    expect(parseVersionState("not-json")).toBeNull();
    expect(parseVersionState("{}")).toBeNull();
  });
});
