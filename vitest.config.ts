import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup/test-env.ts'],
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '.wrangler', 'tests/integration/routes/document-routes.test.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@worker': resolve(__dirname, './worker'),
    },
  },
})
