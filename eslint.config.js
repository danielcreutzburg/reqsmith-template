import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "off",
      // Forbid the removed `sonner` package — the project uses the Radix toast stack
      // exposed via `@/hooks/use-toast`. See scripts/check-removed-deps.mjs.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "sonner",
              message:
                "sonner has been removed. Import { toast, useToast } from '@/hooks/use-toast' instead.",
            },
          ],
          patterns: [
            {
              group: ["@/components/ui/sonner"],
              message: "The sonner wrapper was deleted. Use '@/hooks/use-toast'.",
            },
          ],
        },
      ],
    },
  },
  {
    // Discourage the legacy sonner-shaped helpers; new code should call `toast({...})`.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/hooks/use-toast.ts", "src/test/**"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.object.name='toast'][callee.property.name=/^(success|error)$/]",
          message:
            "Avoid the sonner-style toast.success/.error helpers. Use toast({ description, variant }) from '@/hooks/use-toast'.",
        },
      ],
    },
  },
);

