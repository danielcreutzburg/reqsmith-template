/**
 * Guards for the toast adapter (`@/hooks/use-toast`).
 *
 * The legacy sonner-shaped helpers `toast.success` / `toast.error` are kept
 * only as a thin compatibility shim. These tests ensure that:
 *   1. They behave like a `default` / `destructive` Radix toast.
 *   2. They are flagged as `@deprecated` in source so editors warn on use.
 *   3. ESLint rejects calls to `toast.success` / `toast.error` from any file
 *      other than the adapter itself.
 *   4. ESLint rejects `import … from "sonner"` anywhere in the project.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect, beforeEach } from "vitest";
import { ESLint } from "eslint";
import { renderHook, act } from "@testing-library/react";
import { toast, useToast } from "@/hooks/use-toast";

describe("toast adapter — runtime", () => {
  beforeEach(() => {
    // Drain any leftover toasts from previous tests.
    const { result } = renderHook(() => useToast());
    act(() => result.current.dismiss());
  });

  it("toast.success renders a default-variant toast with the message as description", () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      toast.success("hello");
    });
    expect(result.current.toasts).toHaveLength(1);
    const t = result.current.toasts[0];
    expect(t.description).toBe("hello");
    expect(t.variant).toBeUndefined();
  });

  it("toast.error renders a destructive-variant toast", () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      toast.error("boom");
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].variant).toBe("destructive");
  });

  it("legacy helpers return void (sonner returned an id — we intentionally do not)", () => {
    expect(toast.success("x")).toBeUndefined();
    expect(toast.error("x")).toBeUndefined();
  });
});

describe("toast adapter — source-level deprecation", () => {
  const source = readFileSync("src/hooks/use-toast.ts", "utf8");

  it("marks the success helper as @deprecated", () => {
    expect(source).toMatch(/@deprecated[^\n]*\n\s*success:/);
  });

  it("marks the error helper as @deprecated", () => {
    expect(source).toMatch(/@deprecated[^\n]*\n\s*error:/);
  });
});

describe("toast adapter — lint guards", () => {
  // Use ESLint's Node API instead of spawning a child process inside Vitest.
  // This keeps the guard coverage while avoiding flaky worker shutdowns in CI.
  const runEslint = async (relPath: string, source: string) => {
    const eslint = new ESLint({ cwd: process.cwd() });
    const filePath = join(process.cwd(), "src", "__lint_virtual__", relPath);
    const results = await eslint.lintText(source, { filePath });
    const formatter = await eslint.loadFormatter("stylish");
    const output = formatter.format(results);
    const errorCount = results.reduce((sum, result) => sum + result.errorCount, 0);
    const warningCount = results.reduce((sum, result) => sum + result.warningCount, 0);

    return {
      ok: errorCount === 0 && warningCount === 0,
      output,
      errorCount,
      warningCount,
    };
  };

  it("flags `toast.success(...)` outside the adapter", { timeout: 30000 }, async () => {
    const res = await runEslint(
      "demo.ts",
      `import { toast } from "@/hooks/use-toast";\nexport const f = () => { toast.success("nope"); };\n`,
    );
    expect(res.ok).toBe(false);
    expect(res.output).toMatch(/toast\.success|sonner-style/);
  });

  it("flags `toast.error(...)` outside the adapter", { timeout: 30000 }, async () => {
    const res = await runEslint(
      "demo.ts",
      `import { toast } from "@/hooks/use-toast";\nexport const f = () => { toast.error("nope"); };\n`,
    );
    expect(res.ok).toBe(false);
    expect(res.output).toMatch(/toast\.error|sonner-style/);
  });

  it("blocks `import { toast } from \"sonner\"`", { timeout: 30000 }, async () => {
    const res = await runEslint(
      "demo.ts",
      `import { toast } from "sonner";\nexport const x = toast;\n`,
    );
    expect(res.ok).toBe(false);
    expect(res.output).toMatch(/sonner/);
  });

  it("allows `toast({ description, variant })` calls", { timeout: 30000 }, async () => {
    const res = await runEslint(
      "demo.ts",
      `import { toast } from "@/hooks/use-toast";\nexport const f = () => { toast({ description: "ok", variant: "destructive" }); };\n`,
    );
    expect(res.ok).toBe(true);
  });
});
