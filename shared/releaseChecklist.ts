export const releaseChecklist = [
  { id: "vectorforge-launch", persona: "VectorForge", label: "Launches as the vector workspace", automated: false },
  { id: "photoforge-launch", persona: "PhotoForge Studio", label: "Launches as the photo workspace", automated: false },
  { id: "publisherforge-launch", persona: "PublisherForge", label: "Launches as the publishing workspace", automated: false },
  { id: "pdfx-preflight", persona: "PublisherForge", label: "PDF/X output passes external preflight", automated: false },
  { id: "windows-signing", persona: "All personas", label: "Windows installer is Authenticode-signed", automated: false },
] as const;

export function checklistSummary() {
  return { total: releaseChecklist.length, automated: releaseChecklist.filter((item) => item.automated).length, external: releaseChecklist.filter((item) => !item.automated).length };
}
