export type VectorForgeEvent =
  | "collaboration_invite_created"
  | "collaboration_invite_accepted"
  | "collaboration_invite_regenerated"
  | "collaboration_invite_revoked"
  | "document_version_captured"
  | "document_version_restored"
  | "export_completed"
  | "export_failed";

type Umami = { track?: (event: string, data?: Record<string, string | number | boolean>) => void };

declare global {
  interface Window {
    umami?: Umami;
  }
}

export function trackVectorForgeEvent(event: VectorForgeEvent, metadata: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined") return;
  try {
    window.umami?.track?.(event, metadata);
  } catch {
    // Observability must never interrupt editing or export workflows.
  }
}
