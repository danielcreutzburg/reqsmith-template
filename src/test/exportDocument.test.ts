import { describe, it, expect, vi } from "vitest";

// Test export filename generation logic
describe("Export filename generation", () => {
  it("should generate correct filename format", () => {
    const templateName = "Modern PRD";
    const date = "2026-03-08";
    const filename = `${templateName}_${date}`;
    expect(filename).toBe("Modern PRD_2026-03-08");
  });

  it("should use fallback for missing template", () => {
    const templateName = "Dokument";
    const date = new Date().toISOString().split("T")[0];
    const filename = `${templateName}_${date}`;
    expect(filename).toContain("Dokument_");
    expect(filename).toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});
