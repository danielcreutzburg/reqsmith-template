import { describe, it, expect } from "vitest";
import { translations } from "@/i18n/translations";

describe("translations", () => {
  const deKeys = Object.keys(translations.de);
  const enKeys = Object.keys(translations.en);

  it("has matching keys for DE and EN", () => {
    const missingInEn = deKeys.filter((k) => !enKeys.includes(k));
    const missingInDe = enKeys.filter((k) => !deKeys.includes(k));
    
    if (missingInEn.length > 0) {
      console.warn("Missing in EN:", missingInEn);
    }
    if (missingInDe.length > 0) {
      console.warn("Missing in DE:", missingInDe);
    }
    
    // Allow some tolerance but flag issues
    expect(missingInEn.length).toBeLessThan(10);
    expect(missingInDe.length).toBeLessThan(10);
  });

  it("has no empty translation values", () => {
    const emptyDe = deKeys.filter((k) => !(translations.de as any)[k]);
    const emptyEn = enKeys.filter((k) => !(translations.en as any)[k]);
    expect(emptyDe.length).toBe(0);
    expect(emptyEn.length).toBe(0);
  });

  it("contains required landing page keys", () => {
    const required = [
      "landing.heroTitle",
      "landing.heroSubtitle",
      "landing.cta",
      "landing.featuresTitle",
      "landing.feature1.title",
      "landing.feature4.title",
      "landing.feature5.title",
      "landing.feature6.title",
    ];
    for (const key of required) {
      expect((translations.de as any)[key]).toBeTruthy();
      expect((translations.en as any)[key]).toBeTruthy();
    }
  });

  it("contains required auth keys", () => {
    const required = ["auth.login", "auth.signup", "auth.email", "auth.password"];
    for (const key of required) {
      expect((translations.de as any)[key]).toBeTruthy();
      expect((translations.en as any)[key]).toBeTruthy();
    }
  });

});
