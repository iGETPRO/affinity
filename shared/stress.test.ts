import { describe, expect, it } from "vitest";
import { createSuiteDocument, parseSuiteDocument } from "./suiteDocument";
import { validateSuiteFile } from "./fileSafety";
import { runPreflight } from "./preflight";

describe("large-document release safeguards", () => {
  it("round-trips a 200-page suite envelope without losing page metadata", () => {
    const pages = Array.from({ length: 200 }, (_, index) => ({ id: `page-${index + 1}`, name: `Page ${index + 1}`, elements: 18 }));
    const envelope = createSuiteDocument("publisher", "Large catalogue", { pages });
    const parsed = parseSuiteDocument<typeof envelope.state>(JSON.parse(JSON.stringify(envelope)), "publisher");
    expect(parsed?.state.pages).toHaveLength(200);
    expect(parsed?.state.pages.at(-1)?.name).toBe("Page 200");
  });

  it("rejects oversized raster imports before browser decoding", () => {
    expect(validateSuiteFile("catalogue.psd", 251 * 1024 * 1024).ok).toBe(false);
  });

  it("reports invalid production settings deterministically", () => {
    const result = runPreflight({ outputProfile: "PDF/X-3", colorMode: "RGB", iccProfile: "sRGB IEC61966-2.1", bleedMm: 0, cropMarks: true, slugMm: 0 });
    expect(result.ok).toBe(false);
    expect(result.warnings.length).toBeGreaterThanOrEqual(2);
  });
});
