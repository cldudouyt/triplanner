import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules', 'dist', 'generated', 'prisma'],
    },
    setupFiles: ['./tests/setup.ts'],
    // Run tests sequentially to avoid database conflicts
    fileParallelism: false,
    testTimeout: 30000,
    sequence: {
      hooks: 'list',
    },
  },
})
