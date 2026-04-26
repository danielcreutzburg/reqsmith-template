import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const secretPatterns = [
  { name: "GitHub classic token", regex: /\bghp_[A-Za-z0-9]{36}\b/g },
  { name: "GitHub fine-grained token", regex: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g },
  { name: "OpenAI-style secret", regex: /\bsk-[A-Za-z0-9]{20,}\b/g },
  { name: "AWS access key id", regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: "Google API key", regex: /\bAIza[0-9A-Za-z\-_]{35}\b/g },
  { name: "Private key block", regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { name: "Bearer token", regex: /\bBearer\s+[A-Za-z0-9\-._~+/=]{20,}\b/g },
  { name: "PostgreSQL URI with password", regex: /\bpostgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@[^/\s]+/g },
  { name: "MySQL URI with password", regex: /\bmysql:\/\/[^:\s]+:[^@\s]+@[^/\s]+/g },
  { name: "MongoDB URI with password", regex: /\bmongodb(?:\+srv)?:\/\/[^:\s]+:[^@\s]+@[^/\s]+/g },
];

const allowList = [
  { path: "src/test/security/safeLogger.test.ts", match: "Bearer SUPERSECRETTOKEN12345" },
  { path: "scripts/check-secrets.mjs", match: "Bearer SUPERSECRETTOKEN12345" },
];

const textFileExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".sql",
  ".toml",
  ".yml",
  ".yaml",
  ".env",
  ".txt",
  ".css",
  ".html",
]);

function isTextFile(path) {
  if (path.endsWith(".env") || path.includes(".env.")) return true;
  const dot = path.lastIndexOf(".");
  if (dot === -1) return false;
  return textFileExtensions.has(path.slice(dot));
}

function isAllowed(path, match) {
  return allowList.some(
    (entry) => entry.path === path && (entry.match === "*" || match.includes(entry.match)),
  );
}

function getTrackedFiles() {
  const output = execSync("git ls-files", { encoding: "utf8" });
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(isTextFile);
}

function main() {
  const files = getTrackedFiles();
  const hits = [];

  for (const path of files) {
    let content = "";
    try {
      content = readFileSync(path, "utf8");
    } catch {
      continue;
    }

    for (const { name, regex } of secretPatterns) {
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const value = match[0];
        if (isAllowed(path, value)) continue;
        hits.push({ path, name, value });
      }
    }
  }

  if (hits.length === 0) {
    console.log("Secret scan passed: no suspicious values detected.");
    return;
  }

  console.error("Secret scan failed. Potential secrets found:\n");
  for (const hit of hits) {
    const preview = hit.value.length > 80 ? `${hit.value.slice(0, 80)}...` : hit.value;
    console.error(`- ${hit.path} | ${hit.name} | ${preview}`);
  }
  process.exit(1);
}

main();

