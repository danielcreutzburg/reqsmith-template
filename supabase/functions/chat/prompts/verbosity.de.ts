/**
 * Auto-extracted prompt module: verbosity.de
 *
 * These are the long-form system prompts the chat edge function feeds to the
 * LLM. They were originally inlined in index.ts; splitting them out keeps the
 * handler readable and lets reviewers diff prompt changes in isolation.
 */
export const verbosityPromptsDe: Record<string, string> = {
  "concise": `

DETAILGRAD: KOMPAKT
- Halte deine Antworten kurz und prägnant
- Maximal 3-5 Fragen auf einmal
- Dokumente: Nur die Kernpunkte, keine ausschweifenden Erklärungen
- Bevorzuge Bullet Points und Tabellen über Fließtext`,

  "detailed": `

DETAILGRAD: DETAILLIERT
- Gib ausführliche, umfassende Antworten
- Erkläre Hintergründe und Begründungen
- Stelle 7-10 Fragen mit Kontext, warum jede wichtig ist
- Dokumente: Vollständig ausgearbeitet mit Beispielen und Erläuterungen
- Füge Best-Practice-Hinweise und Tipps hinzu`,
};
