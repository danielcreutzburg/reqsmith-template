#!/usr/bin/env node
/**
 * CI guard: fails if previously removed dependencies reappear in package.json
 * or if any source file imports from deleted shadcn/Radix primitives.
 *
 * Keep this list in sync with the dependency-reduction plan.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const REMOVED_PACKAGES = [
  "sonner",
  "date-fns",
  "@vitest/coverage-v8",
  "@radix-ui/react-checkbox",
  "@radix-ui/react-switch",
  "@radix-ui/react-slider",
  "@radix-ui/react-toggle",
];

// Forbidden import specifiers (deleted local UI primitives + removed packages).
const FORBIDDEN_IMPORTS = [
  ...REMOVED_PACKAGES,
  "@/components/ui/sonner",
  "@/components/ui/checkbox",
  "@/components/ui/switch",
  "@/components/ui/slider",
  "@/components/ui/toggle",
];

const SRC_DIR = "src";
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const errors = [];

// 1) Check package.json
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const allDeps = {
  ...(pkg.dependencies ?? {}),
  ...(pkg.devDependencies ?? {}),
  ...(pkg.peerDependencies ?? {}),
  ...(pkg.optionalDependencies ?? {}),
};
for (const name of REMOVED_PACKAGES) {
  if (name in allDeps) {
    errors.push(`package.json still declares removed dependency: "${name}"`);
  }
}

// 2) Walk src/ for forbidden imports
// Test files legitimately contain forbidden specifiers as string fixtures
// (e.g. to assert that ESLint blocks them). Skip them.
const SKIP_FILE_RE = /(^|\/)(src\/test\/|.*\.test\.(ts|tsx|js|jsx)$)/;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full);
    else if (EXTS.has(extname(entry)) && !SKIP_FILE_RE.test(full)) scan(full);
  }
}

const importRe = /(?:import\s[^'"]*from\s*|import\s*|require\s*\(\s*)['"]([^'"]+)['"]/g;

function scan(file) {
  const src = readFileSync(file, "utf8");
  let m;
  while ((m = importRe.exec(src)) !== null) {
    const spec = m[1];
    for (const forbidden of FORBIDDEN_IMPORTS) {
      if (spec === forbidden || spec.startsWith(forbidden + "/")) {
        const line = src.slice(0, m.index).split("\n").length;
        errors.push(`${file}:${line} imports forbidden module "${spec}"`);
      }
    }
  }
}

walk(SRC_DIR);

if (errors.length > 0) {
  console.error("✗ Removed-dependency guard failed:\n");
  for (const e of errors) console.error("  - " + e);
  console.error(
    `\n${errors.length} violation(s). Update the code or, if intentional, edit scripts/check-removed-deps.mjs.`,
  );
  process.exit(1);
}

console.log(
  `✓ No removed dependencies or forbidden imports found (${REMOVED_PACKAGES.length} packages checked).`,
);
