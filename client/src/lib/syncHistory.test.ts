import { describe, expect, it } from "vitest";
import { filterExportHistory, filterSyncHistory, normalizeCollaboratorName, normalizeShortcutBinding, parseShortcutProfile } from "./syncHistory";

describe("filterSyncHistory", () => {
  it("normalizes identity and one-key bindings safely", () => {
    expect(normalizeCollaboratorName("  Maya Chen  ")).toBe("Maya Chen");
    expect(normalizeCollaboratorName("   ")).toBe("Local designer");
    expect(normalizeShortcutBinding("  g ", "H")).toBe("G");
    expect(normalizeShortcutBinding("", "H")).toBe("H");
  });

  it("matches collaborator and changed-field queries while preserving all-field behavior", () => {
    const records = [
      { collaborator: "Studio peer", fields: ["geometry", "styling"] },
      { collaborator: "Archive peer", fields: ["visibility"] },
    ];

    expect(filterSyncHistory(records, "studio", "all")).toHaveLength(1);
    expect(filterSyncHistory(records, "", "visibility")[0]?.collaborator).toBe("Archive peer");
    expect(filterSyncHistory(records, "missing", "all")).toHaveLength(0);
  });
});


describe("export history and shortcut profile helpers", () => {
  it("filters export history by status", () => {
    const records = [{ status: "ready" as const }, { status: "cancelled" as const }, { status: "preparing" as const }];
    expect(filterExportHistory(records, "cancelled")).toHaveLength(1);
    expect(filterExportHistory(records, "all")).toHaveLength(3);
  });

  it("rejects unsupported shortcut profile schema versions", () => {
    expect(() => parseShortcutProfile(JSON.stringify({ format: "vectorforge-shortcuts", version: 99 }))).toThrow(/Unsupported shortcut profile schema version/);
  });
});


describe("shortcut profile migration", () => {
  it("upgrades a versionless legacy profile", () => {
    const migrated = parseShortcutProfile(JSON.stringify({ format: "vectorforge-shortcuts", profile: "tablet", shortcutBindings: { pan: "g" } }));
    expect(migrated.version).toBe(1);
    expect(migrated.bindings?.pan).toBe("G");
  });
});


describe("export recovery states", () => {
  it("keeps failed jobs addressable by the history filter", () => {
    const records = [{ status: "failed" as const }, { status: "ready" as const }];
    expect(filterExportHistory(records, "failed")).toHaveLength(1);
  });
});
