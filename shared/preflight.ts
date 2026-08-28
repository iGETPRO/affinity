export type PreflightInput = { outputProfile: "PDF/X-1a" | "PDF/X-3" | "PDF/X-4"; colorMode: "CMYK" | "RGB"; iccProfile: string; bleedMm: number; cropMarks: boolean; slugMm: number };

export function runPreflight(input: PreflightInput) {
  const warnings: string[] = [];
  if (input.outputProfile === "PDF/X-1a" && input.colorMode !== "CMYK") warnings.push("PDF/X-1a requires CMYK output.");
  if (input.outputProfile !== "PDF/X-4" && !input.iccProfile) warnings.push("Select an ICC profile for this PDF/X target.");
  if (!Number.isFinite(input.bleedMm) || input.bleedMm < 3) warnings.push("Commercial print output needs at least 3 mm bleed.");
  if (input.cropMarks && input.slugMm === 0) warnings.push("Crop marks are enabled without a slug area.");
  if (input.outputProfile === "PDF/X-3" && input.colorMode === "RGB") warnings.push("PDF/X-3 RGB output requires an explicit calibrated source profile.");
  if (input.slugMm < 0 || !Number.isFinite(input.slugMm)) warnings.push("Slug size must be zero or a positive measurement.");
  const ok = warnings.length === 0;
  const requirements = input.outputProfile === "PDF/X-1a" ? "CMYK + output intent ICC" : input.outputProfile === "PDF/X-3" ? "Calibrated color + output intent ICC" : "ICC-aware live transparency";
  return { ok, warnings, status: ok ? "conformant" as const : "review" as const, blockingIssues: warnings.length, requirements };
}
