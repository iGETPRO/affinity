import { describe, expect, it } from "vitest";
import { cloneVectorAsset, searchVectorAssets } from "./vectorLibrary";

describe("vector asset library", () => {
  const assets = [{ id: "a1", name: "Cobalt Orbit", kind: "symbol" as const, sourceElementIds: ["circle-1"], tags: ["brand", "orbit"] }];

  it("searches by name and tag", () => {
    expect(searchVectorAssets(assets, "orbit")).toHaveLength(1);
    expect(searchVectorAssets(assets, "missing")).toHaveLength(0);
  });

  it("clones nested arrays without sharing references", () => {
    const clone = cloneVectorAsset(assets[0], "a2");
    clone.sourceElementIds.push("line-1");
    expect(clone.id).toBe("a2");
    expect(assets[0].sourceElementIds).toEqual(["circle-1"]);
  });
});
