export type ExternalReleaseStatus = "ready-for-review" | "pending-external-review" | "certificate-required";

export function getReleaseReviewStatus(input: { pdfxConformant: boolean; windowsSigned: boolean }): { status: ExternalReleaseStatus; label: string; detail: string } {
  if (!input.windowsSigned) return { status: "certificate-required", label: "Certificate required", detail: "Portable builds are ready; trusted installer signing remains external." };
  if (!input.pdfxConformant) return { status: "pending-external-review", label: "External review pending", detail: "Run commercial PDF/X preflight before production delivery." };
  return { status: "ready-for-review", label: "Ready for final review", detail: "Automated release checks are complete." };
}
