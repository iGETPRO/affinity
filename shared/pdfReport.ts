export function createPreflightPdf(title: string, lines: readonly string[]): Uint8Array {
  const escape = (value: string) => value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const content = [`BT`, `/F1 16 Tf`, `50 760 Td`, `(${escape(title)}) Tj`, `/F1 10 Tf`, ...lines.flatMap((line) => [`0 -18 Td`, `(${escape(line.slice(0, 110))}) Tj`]), `ET`].join("\\n");
  const objects = [
    `1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj`,
    `2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj`,
    `3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>endobj`,
    `4 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj`,
    `5 0 obj<< /Length ${content.length} >>stream\n${content}\nendstream\nendobj`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) { offsets.push(pdf.length); pdf += `${object}\n`; }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
