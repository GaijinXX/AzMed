// Test setup file for vitest
import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn()
}