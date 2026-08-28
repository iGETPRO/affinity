import { describe, expect, it } from "vitest";
import { runPreflight } from "./preflight";

describe("PDF/X preflight", () => {
  it("flags incompatible PDF/X-1a RGB output and insufficient bleed", () => {
    const result = runPreflight({ outputProfile: "PDF/X-1a", colorMode: "RGB", iccProfile: "", bleedMm: 1, cropMarks: false, slugMm: 0 });
    expect(result.ok).toBe(false);
    expect(result.warnings.join(" ")).toContain("CMYK");
    expect(result.warnings.join(" ")).toContain("3 mm bleed");
  });

  it("accepts a configured PDF/X-4 production profile", () => {
    expect(runPreflight({ outputProfile: "PDF/X-4", colorMode: "CMYK", iccProfile: "ISO Coated v2", bleedMm: 3, cropMarks: true, slugMm: 5 }).ok).toBe(true);
  });
});
