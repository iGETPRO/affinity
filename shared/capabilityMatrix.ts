import type { SuitePersona } from "./suiteDocument";

export const SUITE_CAPABILITIES: Record<SuitePersona, readonly string[]> = {
  vector: ["bezier-nodes", "boolean-geometry", "compound-shapes", "snapping", "svg-export", "psd-bridge", "version-history"],
  photo: ["non-destructive-adjustments", "masks", "crop-pan-zoom", "photo-history", "psd-bridge", "export-history"],
  publisher: ["multi-page-layout", "master-pages", "linked-text-flow", "paragraph-styles", "language-hyphenation", "printer-presets", "pdf-x-preflight"],
};

export function hasCapability(persona: SuitePersona, capability: string): boolean {
  return SUITE_CAPABILITIES[persona].includes(capability);
}
