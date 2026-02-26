import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules/**", "dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      thresholds: {
        /* Global: 80% — Princípio VI da Constituição */
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
      /* Per-file thresholds via custom configuration */
      include: ["src/**/*.ts"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "tests/**",
        "**/*.config.ts",
        "src/server.ts",
        "src/app.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
