import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";
// @ts-ignore - No types available for eslint-plugin-boundaries
import boundaries from "eslint-plugin-boundaries";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default tseslint.config(
  {
    ignores: [".next"],
  },
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      boundaries: boundaries,
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
        },
      ],
      "boundaries/no-private": "error",
    },
    settings: {
      "boundaries/elements": [
        {
          type: "shared",
          pattern: "src/shared/**/*",
        },
        {
          type: "core", 
          pattern: "src/core/**/*",
        },
        {
          type: "features",
          pattern: "src/features/**/*",
        },
        {
          type: "components",
          pattern: "src/components/**/*",
        },
        {
          type: "utils",
          pattern: "src/utils/**/*",
        },
        {
          type: "pages",
          pattern: "src/pages/**/*",
        },
      ],
      "boundaries/ignore": [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/__tests__/**/*",
      ],
    },
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
);
