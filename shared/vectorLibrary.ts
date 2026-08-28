export type VectorAsset = {
  id: string;
  name: string;
  kind: "symbol" | "asset";
  sourceElementIds: string[];
  tags: string[];
};

export function cloneVectorAsset(asset: VectorAsset, nextId: string): VectorAsset {
  return { ...asset, id: nextId, sourceElementIds: [...asset.sourceElementIds], tags: [...asset.tags] };
}

export function searchVectorAssets(assets: readonly VectorAsset[], query: string): VectorAsset[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...assets];
  return assets.filter((asset) => `${asset.name} ${asset.kind} ${asset.tags.join(" ")}`.toLowerCase().includes(normalized));
}
