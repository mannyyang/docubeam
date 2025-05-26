import { vi } from 'vitest'

// Mock Cloudflare Workers environment
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  },
  writable: true,
})

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
}

// Mock environment variables
process.env.MISTRAL_AI_API_KEY = 'test-mistral-key'
process.env.CLOUDFLARE_ACCOUNT_ID = 'test-account-id'
process.env.CLOUDFLARE_DATABASE_ID = 'test-db-id'
process.env.CLOUDFLARE_API_TOKEN = 'test-api-token'
