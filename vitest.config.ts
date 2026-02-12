import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "supabase/functions/**/*.test.ts"],
    coverage: {
      enabled: true,
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/services/marketApi.ts",
        "supabase/functions/market-data/helpers.ts",
      ],
      thresholds: {
        lines: 75,
        functions: 60,
        branches: 55,
        statements: 75,
        perFile: true,
        'src/services/marketApi.ts': {
          lines: 80,
          functions: 60,
          branches: 55,
          statements: 80,
        },
        'supabase/functions/market-data/helpers.ts': {
          lines: 80,
          functions: 80,
          branches: 60,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
