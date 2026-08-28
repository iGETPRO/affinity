export type PublisherTable = { id: string; name: string; columns: string[]; rows: string[][]; headerRow: boolean };

export function createPublisherTable(name: string, columns: string[], rows: string[][] = []): PublisherTable {
  const width = Math.max(1, columns.length);
  return { id: `table-${Math.random().toString(36).slice(2, 8)}`, name: name.trim() || "Untitled table", columns: columns.length ? columns : ["Column 1"], rows: rows.map((row) => Array.from({ length: width }, (_, index) => row[index] ?? "")), headerRow: true };
}

export function tableCellCount(table: PublisherTable): number {
  return table.columns.length * table.rows.length;
}
