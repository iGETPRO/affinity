import { describe, expect, it } from "vitest";
import { createSuiteDocument, parseSuiteDocument } from "./suiteDocument";

describe("suite document envelope", () => {
  it("creates and parses a persona-scoped document", () => {
    const document = createSuiteDocument("vector", "  Campaign mark  ", { pages: 2 });
    expect(document.title).toBe("Campaign mark");
    expect(parseSuiteDocument<typeof document.state>(document, "vector")?.state).toEqual({ pages: 2 });
  });

  it("rejects documents intended for another persona", () => {
    const document = createSuiteDocument("photo", "Portrait", { layers: 4 });
    expect(parseSuiteDocument(document, "publisher")).toBeNull();
  });
});
