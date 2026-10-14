import { defineConfig } from "vitest/config";

export default defineConfig({
  // three-spritetext and 3d-force-graph must share one copy of three
  resolve: { dedupe: ["three"] },
  build: { chunkSizeWarningLimit: 1500 },
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});
