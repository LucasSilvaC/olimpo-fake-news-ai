import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import unusedImports from "eslint-plugin-unused-imports";

const restrictedServerImports = [
  {
    name: "@/server/infrastructure",
    message: "Presentation must not depend on infrastructure implementations.",
  },
];

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  prettier,
  {
    plugins: { "unused-imports": unusedImports },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "import/no-unresolved": "off",
      "unused-imports/no-unused-imports": "error",
      "import/order": [
        "error",
        { "newlines-between": "always", alphabetize: { order: "asc", caseInsensitive: true } },
      ],
    },
  },
  {
    files: ["src/server/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@/server/application/*",
            "@/server/infrastructure/*",
            "@/server/presentation/*",
            "next/*",
            "react",
          ],
        },
      ],
    },
  },
  {
    files: ["src/server/application/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: ["@/server/infrastructure/*", "@/server/presentation/*", "next/*", "react"] },
      ],
    },
  },
  {
    files: ["src/server/presentation/**/*.ts"],
    rules: { "no-restricted-imports": ["error", { paths: restrictedServerImports }] },
  },
  {
    files: [
      "src/components/**/*.{ts,tsx}",
      "src/entities/**/*.{ts,tsx}",
      "src/features/**/*.{ts,tsx}",
      "src/widgets/**/*.{ts,tsx}",
      "src/views/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: ["@/server/domain/*", "@/server/infrastructure/*", "@/server/application/*"] },
      ],
    },
  },
  {
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/entities/*", "@/features/*", "@/widgets/*", "@/views/*", "@/server/*"],
        },
      ],
    },
  },
  {
    files: ["src/entities/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/features/*", "@/widgets/*", "@/views/*", "@/server/*"],
        },
      ],
    },
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/widgets/*", "@/views/*"],
        },
      ],
    },
  },
  {
    files: ["src/widgets/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/views/*"],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "coverage/**",
    "drizzle/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
    "scripts/**",
    "validation/**",
  ]),
]);
