/**
 * Translations · EN · combined map.
 * Merges all namespace files into the flat key→value object the
 * `useLanguage()` hook expects.
 */
import { auth } from "./auth";
import { chat } from "./chat";
import { common } from "./common";
import { dashboard } from "./dashboard";
import { editor } from "./editor";
import { landing } from "./landing";
import { legal } from "./legal";
import { notifications } from "./notifications";
import { onboarding } from "./onboarding";
import { sessions } from "./sessions";
import { templates } from "./templates";

export const en = {
  ...auth,
  ...chat,
  ...common,
  ...dashboard,
  ...editor,
  ...landing,
  ...legal,
  ...notifications,
  ...onboarding,
  ...sessions,
  ...templates,
} as const;
