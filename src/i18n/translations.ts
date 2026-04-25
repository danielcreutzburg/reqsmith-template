/**
 * Project translations.
 *
 * Structured as: `locales/<locale>/<namespace>.ts` for readability.
 * The `translations` object below is the flat shape the
 * `useLanguage()` hook consumes — same API as before.
 */
import { de } from "./locales/de";
import { en } from "./locales/en";

export const translations = { de, en } as const;

export type Language = keyof typeof translations;
/** @deprecated Use `Language` instead. */
export type Locale = Language;
export type TranslationKey = keyof typeof translations.de;

