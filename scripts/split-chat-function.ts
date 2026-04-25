/**
 * Migration script: split supabase/functions/chat/index.ts into prompt modules.
 *
 * The original file mixes ~1700 lines of prompt strings with ~250 lines of
 * actual handler logic. This script extracts the prompt blocks into
 * `supabase/functions/chat/prompts/` and rewrites `index.ts` to be a
 * lean handler that imports them.
 *
 * Run once with: bun scripts/split-chat-function.ts
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const SRC_PATH = "supabase/functions/chat/index.ts";
const OUT_DIR = "supabase/functions/chat/prompts";

// Slices use 1-indexed line numbers, INCLUSIVE on both ends.
// They correspond to the `const X = ...;` statements in the original file.
const SLICES: Array<{ name: string; firstLine: number; lastLine: number }> = [
  { name: "templates.de",        firstLine: 12,   lastLine: 789  },
  { name: "templates.en",        firstLine: 794,  lastLine: 1352 },
  { name: "base.de",             firstLine: 1357, lastLine: 1458 },
  { name: "planMode.de",         firstLine: 1460, lastLine: 1470 },
  { name: "base.en",             firstLine: 1472, lastLine: 1573 },
  { name: "planMode.en",         firstLine: 1575, lastLine: 1585 },
  { name: "coachingMode.de",     firstLine: 1590, lastLine: 1604 },
  { name: "coachingMode.en",     firstLine: 1606, lastLine: 1620 },
  { name: "personas.de",         firstLine: 1625, lastLine: 1645 },
  { name: "personas.en",         firstLine: 1647, lastLine: 1667 },
  { name: "verbosity.de",        firstLine: 1672, lastLine: 1689 },
  { name: "verbosity.en",        firstLine: 1691, lastLine: 1708 },
];

const HEADER = (name: string) => `/**
 * Auto-extracted prompt module: ${name}
 *
 * These are the long-form system prompts the chat edge function feeds to the
 * LLM. They were originally inlined in index.ts; splitting them out keeps the
 * handler readable and lets reviewers diff prompt changes in isolation.
 */
`;

function ensureDir(p: string) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function main() {
  const src = readFileSync(SRC_PATH, "utf-8");
  const lines = src.split("\n");
  ensureDir(OUT_DIR);

  for (const slice of SLICES) {
    const body = lines.slice(slice.firstLine - 1, slice.lastLine).join("\n");
    const content = HEADER(slice.name) + "export " + body + "\n";
    const outPath = `${OUT_DIR}/${slice.name}.ts`;
    writeFileSync(outPath, content);
    console.log(`  wrote ${outPath} (${slice.lastLine - slice.firstLine + 1} lines)`);
  }

  // Build prompts index re-exporter
  const indexContent = `/**
 * Prompt registry — single import surface for the chat handler.
 */
export { templatesDe } from "./templates.de.ts";
export { templatesEn } from "./templates.en.ts";
export { baseSystemPromptDe } from "./base.de.ts";
export { baseSystemPromptEn } from "./base.en.ts";
export { planModeAdditionDe } from "./planMode.de.ts";
export { planModeAdditionEn } from "./planMode.en.ts";
export { coachingModeAdditionDe } from "./coachingMode.de.ts";
export { coachingModeAdditionEn } from "./coachingMode.en.ts";
export { personaPromptsDe } from "./personas.de.ts";
export { personaPromptsEn } from "./personas.en.ts";
export { verbosityPromptsDe } from "./verbosity.de.ts";
export { verbosityPromptsEn } from "./verbosity.en.ts";
`;
  writeFileSync(`${OUT_DIR}/index.ts`, indexContent);
  console.log(`  wrote ${OUT_DIR}/index.ts`);
}

main();
