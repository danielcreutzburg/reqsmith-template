import { describe, it, expect } from "vitest";
import { templates } from "@/features/templates/templateData";
import { TemplateSchema, MessageSchema } from "@/types/chat";

describe("templateData", () => {
  it("exposes a non-empty list of templates", () => {
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThan(5);
  });

  it("every template matches the TemplateSchema", () => {
    for (const tpl of templates) {
      expect(() => TemplateSchema.parse(tpl)).not.toThrow();
    }
  });

  it("template ids are unique", () => {
    const ids = new Set(templates.map((t) => t.id));
    expect(ids.size).toBe(templates.length);
  });

  it("includes the canonical modern-prd template", () => {
    expect(templates.find((t) => t.id === "modern-prd")).toBeTruthy();
  });
});

describe("chat schemas", () => {
  it("MessageSchema validates a well-formed message", () => {
    expect(() =>
      MessageSchema.parse({ id: "m1", role: "user", content: "hi", timestamp: new Date() })
    ).not.toThrow();
  });

  it("MessageSchema rejects an invalid role", () => {
    expect(() =>
      MessageSchema.parse({ id: "m1", role: "system", content: "hi", timestamp: new Date() })
    ).toThrow();
  });
});
