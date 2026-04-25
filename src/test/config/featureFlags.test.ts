import { describe, it, expect } from "vitest";
import { featureFlags } from "@/config/featureFlags";

describe("featureFlags", () => {
  it("all flags are boolean values", () => {
    for (const [key, value] of Object.entries(featureFlags)) {
      expect(typeof value).toBe("boolean");
    }
  });

  it("all flags default to false", () => {
    for (const [key, value] of Object.entries(featureFlags)) {
      expect(value).toBe(false);
    }
  });
});
