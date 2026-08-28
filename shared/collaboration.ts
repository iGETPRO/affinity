export function normalizeInviteEmail(email: string) {
  return email.trim().toLowerCase();
}

export function retainLatestVersions<T extends { id: number }>(versions: T[], limit = 12) {
  return [...versions].sort((a, b) => b.id - a.id).slice(0, limit);
}

export function isInviteExpired(expiresAt: Date | string | null | undefined, now = Date.now()) {
  return Boolean(expiresAt && new Date(expiresAt).getTime() <= now);
}

export function formatAuditAction(action: string, detail?: string | null) {
  return detail ? `${action} · ${detail}` : action;
}

export function parseVersionState<T>(stateJson: string): T[] | null {
  try {
    const parsed = JSON.parse(stateJson);
    return Array.isArray(parsed) ? parsed as T[] : null;
  } catch {
    return null;
  }
}
