import { describe, expect, it } from "vitest";
import { detectSuiteFormat, validateSuiteFile } from "./fileSafety";

describe("suite file safety", () => {
  it("detects supported extensions case-insensitively", () => {
    expect(detectSuiteFormat("cover.SVG")).toBe("svg");
    expect(detectSuiteFormat("portrait.afphoto")).toBe("afphoto");
    expect(detectSuiteFormat("notes.pdf")).toBeNull();
  });

  it("returns actionable size diagnostics", () => {
    expect(validateSuiteFile("cover.svg", 1024).ok).toBe(true);
    expect(validateSuiteFile("large.psd", 300 * 1024 * 1024).message).toContain("smaller than 250 MB");
  });
});
