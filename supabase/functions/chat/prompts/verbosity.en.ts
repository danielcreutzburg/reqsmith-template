/**
 * Auto-extracted prompt module: verbosity.en
 *
 * These are the long-form system prompts the chat edge function feeds to the
 * LLM. They were originally inlined in index.ts; splitting them out keeps the
 * handler readable and lets reviewers diff prompt changes in isolation.
 */
export const verbosityPromptsEn: Record<string, string> = {
  "concise": `

DETAIL LEVEL: CONCISE
- Keep your answers short and to the point
- Maximum 3-5 questions at a time
- Documents: Only key points, no elaborate explanations
- Prefer bullet points and tables over prose`,

  "detailed": `

DETAIL LEVEL: DETAILED
- Give comprehensive, thorough answers
- Explain backgrounds and reasoning
- Ask 7-10 questions with context on why each matters
- Documents: Fully elaborated with examples and explanations
- Add best-practice tips and guidance`,
};
