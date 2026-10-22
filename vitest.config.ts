import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests for the screens' plain logic (no DOM). Same runner as opmap-api.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts"] },
});
