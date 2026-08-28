export type SuitePersona = "vector" | "photo" | "publisher";

export type SuiteDocumentEnvelope<TState> = {
  format: "vectorforge-suite-document";
  version: 1;
  persona: SuitePersona;
  title: string;
  savedAt: string;
  state: TState;
};

export function createSuiteDocument<TState>(persona: SuitePersona, title: string, state: TState): SuiteDocumentEnvelope<TState> {
  return { format: "vectorforge-suite-document", version: 1, persona, title: title.trim() || "Untitled document", savedAt: new Date().toISOString(), state };
}

export function parseSuiteDocument<TState>(value: unknown, persona: SuitePersona): SuiteDocumentEnvelope<TState> | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<SuiteDocumentEnvelope<TState>>;
  if (candidate.format !== "vectorforge-suite-document" || candidate.version !== 1 || candidate.persona !== persona || !candidate.state) return null;
  return { format: candidate.format, version: candidate.version, persona: candidate.persona, title: String(candidate.title || "Untitled document"), savedAt: String(candidate.savedAt || new Date().toISOString()), state: candidate.state };
}
