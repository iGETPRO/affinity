export type SyncHistoryFilterRecord = {
  collaborator: string;
  fields: string[];
};

export function normalizeCollaboratorName(value: string): string {
  return value.trim().slice(0, 48) || "Local designer";
}

export function normalizeShortcutBinding(value: string, fallback: string): string {
  return value.trim().slice(-1).toUpperCase() || fallback;
}

export function filterSyncHistory<T extends SyncHistoryFilterRecord>(records: T[], query: string, field: string): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  return records.filter((record) => {
    const haystack = `${record.collaborator} ${record.fields.join(" ")}`.toLowerCase();
    return (!normalizedQuery || haystack.includes(normalizedQuery)) && (field === "all" || record.fields.includes(field));
  });
}

export type ExportHistoryStatus = "all" | "queued" | "preparing" | "ready" | "cancelled" | "failed";

export function filterExportHistory<T extends { status: Exclude<ExportHistoryStatus, "all"> }>(records: T[], status: ExportHistoryStatus): T[] {
  return status === "all" ? records : records.filter((record) => record.status === status);
}

export type ShortcutProfilePayload = { format?: string; version?: number; profile?: "precision" | "tablet"; bindings?: Record<string, string> };

export function parseShortcutProfile(text: string): ShortcutProfilePayload {
  const payload = JSON.parse(text) as ShortcutProfilePayload & { shortcutBindings?: Record<string, string> };
  if (payload.format !== "vectorforge-shortcuts") throw new Error(`Unsupported shortcut profile schema version ${payload.version ?? "unknown"}`);
  if (payload.version === 1) return payload;
  if (payload.version === undefined || payload.version === 0) {
    const migrated = migrateShortcutProfile({ ...payload, bindings: payload.bindings ?? payload.shortcutBindings });
    return { format: "vectorforge-shortcuts", version: 1, profile: migrated.profile, bindings: migrated.bindings };
  }
  throw new Error(`Unsupported shortcut profile schema version ${payload.version}`);
}

export function migrateShortcutProfile(raw: unknown): { profile: "precision" | "tablet"; bindings: Record<string, string> } {
  if (!raw || typeof raw !== "object") return { profile: "precision", bindings: {} };
  const value = raw as { profile?: unknown; bindings?: unknown; version?: unknown };
  const profile = value.profile === "tablet" ? "tablet" : "precision";
  const source = value.bindings && typeof value.bindings === "object" ? value.bindings as Record<string, unknown> : raw as Record<string, unknown>; const bindings = Object.fromEntries(Object.entries(source).filter(([id, shortcut]) => !["format", "version", "profile"].includes(id) && typeof shortcut === "string").map(([id, shortcut]) => [id, String(shortcut).slice(-1).toUpperCase()]));
  return { profile, bindings };
}
