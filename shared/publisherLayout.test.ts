import { describe, expect, it } from "vitest";
import { createPublisherTable, tableCellCount } from "./publisherLayout";

describe("publisher layout tables", () => {
  it("normalizes rows to the declared column count", () => {
    const table = createPublisherTable("Specs", ["Name", "Value"], [["Bleed"]]);
    expect(table.rows).toEqual([["Bleed", ""]]);
    expect(tableCellCount(table)).toBe(2);
  });
});
