export type PhotoSourceMetadata = {
  filename: string;
  colorSpace: "sRGB" | "Display P3" | "Adobe RGB";
  bitDepth: 8 | 16 | 32;
  rawDevelopment: boolean;
};

export type PhotoPipelineLayer = { id: string; name: string; enabled: boolean; amount: number; blend: "normal" | "overlay" | "multiply" | "screen" };

export function normalizePhotoPipeline(source: Partial<PhotoSourceMetadata>, layers: readonly PhotoPipelineLayer[]) {
  return {
    source: { filename: source.filename || "Untitled image", colorSpace: source.colorSpace || "sRGB", bitDepth: source.bitDepth || 8, rawDevelopment: source.rawDevelopment ?? false },
    layers: layers.map((layer) => ({ ...layer, amount: Math.max(-100, Math.min(100, layer.amount)) })),
  };
}

export function enabledPhotoLayers(layers: readonly PhotoPipelineLayer[]): PhotoPipelineLayer[] {
  return layers.filter((layer) => layer.enabled);
}
