import { describe, expect, it } from "vitest";
import { checklistSummary, releaseChecklist } from "./releaseChecklist";

describe("external release checklist", () => {
  it("covers all three personas and external production gates", () => {
    const summary = checklistSummary();
    expect(summary.total).toBe(releaseChecklist.length);
    expect(summary.external).toBeGreaterThanOrEqual(2);
    expect(releaseChecklist.map((item) => item.persona)).toEqual(expect.arrayContaining(["VectorForge", "PhotoForge Studio", "PublisherForge"]));
  });
});
