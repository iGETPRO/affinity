import { describe, expect, it } from "vitest";
import { hasCapability, SUITE_CAPABILITIES } from "./capabilityMatrix";

describe("suite capability matrix", () => {
  it("keeps the three personas distinct and populated", () => {
    expect(Object.keys(SUITE_CAPABILITIES)).toEqual(["vector", "photo", "publisher"]);
    expect(SUITE_CAPABILITIES.vector.length).toBeGreaterThan(4);
    expect(SUITE_CAPABILITIES.photo.length).toBeGreaterThan(4);
    expect(SUITE_CAPABILITIES.publisher.length).toBeGreaterThan(4);
  });

  it("answers capability checks", () => {
    expect(hasCapability("vector", "bezier-nodes")).toBe(true);
    expect(hasCapability("photo", "masks")).toBe(true);
    expect(hasCapability("publisher", "pdf-x-preflight")).toBe(true);
    expect(hasCapability("vector", "raw-development")).toBe(false);
  });
});
