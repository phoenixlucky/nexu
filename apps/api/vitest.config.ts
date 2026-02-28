import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Tests share a single postgres test DB and manage tables themselves.
    // Run files sequentially to prevent DROP/CREATE conflicts.
    fileParallelism: false,
  },
});
