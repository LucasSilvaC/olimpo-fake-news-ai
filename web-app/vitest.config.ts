import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    include: [
      "tests/unit/**/*.test.{ts,tsx}",
      "tests/components/**/*.test.{ts,tsx}",
      "src/app/api/**/tests/**/*.test.{ts,tsx}",
    ],
    coverage: {
      provider: "v8",
      include: [
        "src/server/domain/**/*.ts",
        "src/server/application/**/*.ts",
        "src/features/**/*.ts",
        "src/features/**/*.tsx",
      ],
      thresholds: { statements: 70, branches: 60, functions: 70, lines: 70 },
    },
  },
});
