export type SupportedSuiteFormat = "svg" | "psd" | "af" | "afphoto" | "pforge" | "png" | "jpg";

const FORMAT_LIMITS: Record<SupportedSuiteFormat, number> = { svg: 20, psd: 250, af: 250, afphoto: 250, pforge: 100, png: 100, jpg: 100 };

export function detectSuiteFormat(filename: string): SupportedSuiteFormat | null {
  const extension = filename.toLowerCase().split(".").pop();
  return extension && extension in FORMAT_LIMITS ? (extension as SupportedSuiteFormat) : null;
}

export function validateSuiteFile(filename: string, sizeBytes: number) {
  const format = detectSuiteFormat(filename);
  if (!format) return { ok: false, format: null, message: "Unsupported file type. Use SVG, PSD/AF, APhoto, PForge, PNG, or JPG." };
  const maxBytes = FORMAT_LIMITS[format] * 1024 * 1024;
  if (sizeBytes > maxBytes) return { ok: false, format, message: `${format.toUpperCase()} files must be smaller than ${FORMAT_LIMITS[format]} MB for browser-safe editing.` };
  return { ok: true, format, message: "File is ready to import." };
}
