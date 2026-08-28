import { describe, expect, it } from "vitest";
import { normalizeInviteEmail, parseVersionState, retainLatestVersions } from "./collaboration";

describe("collaboration helpers", () => {
  it("normalizes invite emails", () => expect(normalizeInviteEmail("  Designer@Example.COM ")).toBe("designer@example.com"));
  it("retains the latest twelve versions", () => {
    const retained = retainLatestVersions(Array.from({ length: 14 }, (_, index) => ({ id: index + 1 })));
    expect(retained).toHaveLength(12);
    expect(retained[0].id).toBe(14);
    expect(retained.at(-1)?.id).toBe(3);
  });
  it("rejects malformed version state without throwing", () => {
    expect(parseVersionState("not-json")).toBeNull();
    expect(parseVersionState("{}")) .toBeNull();
  });
});
