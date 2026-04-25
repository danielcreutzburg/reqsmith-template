/**
 * Security tests: ensure the LLM `api_key` never leaks via
 *  - Edge function source code (no logging, no inclusion in responses)
 *  - Frontend code (never read from responses, never persisted)
 *  - Database type definitions used in client SELECTs
 *
 * These tests run statically against repository files. They do not
 * hit the network, so they are deterministic in CI.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(__dirname, "../../..");
const EDGE_DIR = join(ROOT, "supabase/functions");
const FRONTEND_DIR = join(ROOT, "src");

function walk(dir: string, exts: string[]): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walk(full, exts));
    } else if (exts.some((e) => full.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

const EDGE_FILES = walk(EDGE_DIR, [".ts"]).filter((f) => !f.includes("/_shared/"));
const FRONTEND_FILES = walk(FRONTEND_DIR, [".ts", ".tsx"]).filter(
  (f) =>
    !f.includes("/test/") &&
    !f.endsWith(".test.ts") &&
    !f.endsWith(".test.tsx") &&
    !f.includes("/integrations/supabase/types.ts"),
);

/** Strip line and block comments so we don't false-positive on documentation. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

describe("Edge functions never log the LLM api_key", () => {
  it("contain no console.* call that references api_key / secretKey / Bearer interpolation", () => {
    const offenders: string[] = [];
    const consoleRe = /console\.(log|info|warn|error|debug)\s*\(([^)]*)\)/g;

    for (const file of EDGE_FILES) {
      const src = stripComments(readFileSync(file, "utf8"));
      let m: RegExpExecArray | null;
      while ((m = consoleRe.exec(src)) !== null) {
        const args = m[2];
        // Forbidden tokens inside the argument list of any console call.
        if (
          /\bapi_key\b/i.test(args) ||
          /\bsecretKey\b/.test(args) ||
          /\b_new_key\b/.test(args) ||
          /Bearer\s*\$\{/.test(args) ||
          /\bdecrypted_secret\b/.test(args)
        ) {
          offenders.push(`${file}: ${m[0]}`);
        }
      }
    }

    expect(offenders, `Forbidden secret logging:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("never echo the request body verbatim", () => {
    // POST bodies to admin-llm-settings include `api_key`. Logging the whole
    // body would leak it. Disallow JSON.stringify(body|req) inside console.*.
    const offenders: string[] = [];
    const re = /console\.\w+\s*\([^)]*JSON\.stringify\s*\(\s*(body|req|request|payload)\b/g;
    for (const file of EDGE_FILES) {
      const src = stripComments(readFileSync(file, "utf8"));
      let m: RegExpExecArray | null;
      while ((m = re.exec(src)) !== null) {
        offenders.push(`${file}: ${m[0]}`);
      }
    }
    expect(offenders, `Bodies must not be logged:\n${offenders.join("\n")}`).toEqual([]);
  });
});

describe("admin-llm-settings response shape never includes api_key", () => {
  const file = join(EDGE_DIR, "admin-llm-settings/index.ts");
  const src = readFileSync(file, "utf8");

  it("GET handler does not select api_key from llm_settings", () => {
    // The GET branch must select an explicit allow-list of columns.
    const getMatch = src.match(/req\.method\s*===\s*"GET"[\s\S]*?return new Response/);
    expect(getMatch, "GET branch not found").toBeTruthy();
    const getBlock = getMatch![0];
    expect(getBlock).not.toMatch(/\.select\([^)]*\bapi_key\b[^)]*\)/);
    expect(getBlock).toMatch(/\.select\(\s*"[^"]*has_custom_key[^"]*"\s*\)/);
  });

  it("never serialises api_key or secretKey into a Response", () => {
    const responseRe = /new Response\(\s*JSON\.stringify\(\s*([\s\S]*?)\)\s*,/g;
    const offenders: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = responseRe.exec(src)) !== null) {
      const payload = m[1];
      // Strip string literals so we ignore static error messages like
      // `{ error: "api_key must be a string" }`.
      const code = payload
        .replace(/"(?:[^"\\]|\\.)*"/g, '""')
        .replace(/'(?:[^'\\]|\\.)*'/g, "''")
        .replace(/`(?:[^`\\]|\\.)*`/g, "``");
      if (
        /\bapi_key\b/.test(code) ||
        /\bsecretKey\b/.test(code) ||
        /\b_new_key\b/.test(code) ||
        /\bdecrypted_secret\b/.test(code)
      ) {
        offenders.push(m[0].slice(0, 200));
      }
    }
    expect(offenders, `Response leaks key:\n${offenders.join("\n")}`).toEqual([]);
  });
});

describe("Frontend never reads or stores the LLM api_key from responses", () => {
  it("no client file selects api_key from llm_settings", () => {
    const offenders: string[] = [];
    // Either `.from("llm_settings")...select(... api_key ...)` or destructuring
    // `api_key` out of a llm_settings response.
    for (const file of FRONTEND_FILES) {
      const src = stripComments(readFileSync(file, "utf8"));
      if (!src.includes("llm_settings")) continue;
      // Block any select that names api_key
      if (/llm_settings[\s\S]{0,500}\.select\([^)]*\bapi_key\b/.test(src)) {
        offenders.push(`${file}: selects api_key from llm_settings`);
      }
      // Block destructuring api_key out of an llm_settings response
      if (/llm_settings[\s\S]{0,500}\.\s*data[\s\S]{0,200}api_key/.test(src)) {
        offenders.push(`${file}: reads api_key from llm_settings response`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("LlmSettingsCard does not persist the api_key after save", () => {
    const file = join(FRONTEND_DIR, "features/admin/components/LlmSettingsCard.tsx");
    const src = readFileSync(file, "utf8");
    // The local input state must be cleared after save / clear.
    expect(src).toMatch(/setApiKey\(""\)/);
    // No localStorage / sessionStorage writes touching the key.
    expect(src).not.toMatch(/localStorage\.[a-zA-Z]+\([^)]*api[_-]?[Kk]ey/);
    expect(src).not.toMatch(/sessionStorage\.[a-zA-Z]+\([^)]*api[_-]?[Kk]ey/);
  });

  it("no client file calls the privileged set/get/clear key RPCs", () => {
    const banned = ["get_llm_api_key", "set_llm_api_key", "clear_llm_api_key"];
    const offenders: string[] = [];
    for (const file of FRONTEND_FILES) {
      const src = stripComments(readFileSync(file, "utf8"));
      for (const name of banned) {
        if (new RegExp(`\\.rpc\\(\\s*["']${name}["']`).test(src)) {
          offenders.push(`${file}: client calls forbidden RPC ${name}`);
        }
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
