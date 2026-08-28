import { describe, expect, it } from "vitest";
import { enabledPhotoLayers, normalizePhotoPipeline } from "./photoPipeline";

describe("photo pipeline", () => {
  it("normalizes source metadata and clamps layer amounts", () => {
    const result = normalizePhotoPipeline({ filename: "camera.raw", colorSpace: "Adobe RGB", bitDepth: 16, rawDevelopment: true }, [{ id: "l1", name: "Highlights", enabled: true, amount: 140, blend: "normal" }]);
    expect(result.source.rawDevelopment).toBe(true);
    expect(result.layers[0].amount).toBe(100);
  });

  it("returns only enabled adjustment layers", () => {
    const layers = [{ id: "1", name: "Exposure", enabled: true, amount: 10, blend: "normal" as const }, { id: "2", name: "Vignette", enabled: false, amount: 20, blend: "multiply" as const }];
    expect(enabledPhotoLayers(layers).map((layer) => layer.name)).toEqual(["Exposure"]);
  });
});
