import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.test.ts'],
    testTimeout: 30000,
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/__tests__/**', 'src/**/*.d.ts'],
      // Conservative regression-floor (actual coverage not yet measured against a
      // running test DB). Prevents coverage collapsing to zero; ratchet toward 80
      // once the suite is measured in CI.
      // Measured floor (lines ~46%, stmts ~45%, funcs ~42%, branches ~32%) with a
      // small margin. Ratchet up toward 80 as coverage grows.
      thresholds: {
        lines: 42,
        functions: 40,
        branches: 30,
        statements: 42,
      },
    },
  },
});
