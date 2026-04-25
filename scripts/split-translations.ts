/**
 * Migration script: split src/i18n/translations.ts into namespaced modules.
 * Run once with: bun scripts/split-translations.ts
 *
 * Reads the existing translations.ts, parses the de + en objects,
 * groups keys by their first dot-separated segment into namespaces,
 * and writes one file per (locale, namespace) plus an index per locale.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

// Map of first-segment → namespace bucket. Anything not listed lands in "common".
const NAMESPACE_MAP: Record<string, string> = {
  template: "templates",
  customTemplate: "templates",
  chat: "chat",
  typing: "chat",
  doc: "editor",
  diff: "editor",
  diffReview: "editor",
  validation: "editor",
  summary: "editor",
  glossary: "editor",
  import: "editor",
  scorecard: "editor",
  auth: "auth",
  avatar: "auth",
  account: "auth",
  session: "sessions",
  autoSave: "sessions",
  search: "sessions",
  attachment: "chat",
  dashboard: "dashboard",
  badges: "dashboard",
  prompts: "chat",
  persona: "chat",
  verbosity: "chat",
  landing: "landing",
  cookie: "legal",
  footer: "legal",
  onboarding: "onboarding",
  emailNotif: "notifications",
  error: "common",
  usage: "common",
  notFound: "common",
  tabs: "common",
  header: "common",
  a11y: "common",
};

const NAMESPACES = Array.from(new Set(Object.values(NAMESPACE_MAP))).concat("common").filter((v, i, a) => a.indexOf(v) === i);

interface Entry { key: string; value: string; }

function namespaceOf(key: string): string {
  const head = key.split(".")[0];
  return NAMESPACE_MAP[head] ?? "common";
}

function parseLocaleBlock(src: string, locale: "de" | "en"): Entry[] {
  // Use a regex anchored to line start to avoid matching strings like `en: {terms}`
  const re = new RegExp(`\\n\\s{2}${locale}:\\s*\\{`);
  const m = re.exec(src);
  if (!m) throw new Error(`Locale block ${locale} not found`);
  let i = m.index + m[0].length;
  let depth = 1;
  const blockStart = i;
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    i++;
  }
  const block = src.slice(blockStart, i - 1);

  // Match "key": "value", supporting escaped quotes and literal \n inside the string.
  const entries: Entry[] = [];
  const kvRe = /"([^"\\]+)"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,?/g;
  let kv: RegExpExecArray | null;
  while ((kv = kvRe.exec(block)) !== null) {
    entries.push({ key: kv[1], value: kv[2] });
  }
  return entries;
}

function emitNamespaceFile(locale: string, ns: string, entries: Entry[]): string {
  const lines = [
    `/**`,
    ` * Translations · ${locale.toUpperCase()} · namespace: ${ns}`,
    ` * Auto-grouped by key prefix. Edit values freely; keys must stay flat strings`,
    ` * because the i18n lookup uses the full dotted key.`,
    ` */`,
    `export const ${ns} = {`,
  ];
  for (const e of entries) {
    lines.push(`  "${e.key}": "${e.value}",`);
  }
  lines.push(`} as const;`);
  lines.push("");
  return lines.join("\n");
}

function emitLocaleIndex(locale: string, used: string[]): string {
  const imports = used.map((ns) => `import { ${ns} } from "./${ns}";`).join("\n");
  return `/**
 * Translations · ${locale.toUpperCase()} · combined map.
 * Merges all namespace files into the flat key→value object the
 * \`useLanguage()\` hook expects.
 */
${imports}

export const ${locale} = {
${used.map((ns) => `  ...${ns},`).join("\n")}
} as const;
`;
}

function ensureDir(p: string) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function main() {
  const src = readFileSync("src/i18n/translations.ts", "utf-8");

  for (const locale of ["de", "en"] as const) {
    const entries = parseLocaleBlock(src, locale);
    const grouped = new Map<string, Entry[]>();
    for (const e of entries) {
      const ns = namespaceOf(e.key);
      if (!grouped.has(ns)) grouped.set(ns, []);
      grouped.get(ns)!.push(e);
    }

    const dir = `src/i18n/locales/${locale}`;
    ensureDir(dir);
    const usedNs: string[] = [];
    for (const [ns, list] of grouped) {
      writeFileSync(join(dir, `${ns}.ts`), emitNamespaceFile(locale, ns, list));
      usedNs.push(ns);
    }
    usedNs.sort();
    writeFileSync(join(dir, "index.ts"), emitLocaleIndex(locale, usedNs));
    console.log(`[${locale}] ${entries.length} keys → ${usedNs.length} namespaces`);
  }

  // Master index
  const masterIndex = `/**
 * Project translations.
 *
 * Structured as: \`locales/<locale>/<namespace>.ts\` for readability.
 * The \`translations\` object below is the flat shape the
 * \`useLanguage()\` hook consumes — same API as before.
 */
import { de } from "./locales/de";
import { en } from "./locales/en";

export const translations = { de, en } as const;

export type Locale = keyof typeof translations;
export type TranslationKey = keyof typeof translations.de;
`;
  writeFileSync("src/i18n/translations.ts", masterIndex);
  console.log("Wrote src/i18n/translations.ts (index)");
}

main();
