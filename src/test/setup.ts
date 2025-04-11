import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import * as preact from 'preact';

// Alias React to Preact for testing
globalThis.React = preact;

expect.extend(matchers);

// Mock fetch globally
global.fetch = vi.fn();

// Mock database client
vi.mock('../db/setup', () => ({
  dbClient: {
    query: vi.fn().mockResolvedValue({ rows: [] }),
    end: vi.fn()
  }
}));

// Reset all mocks and cleanup after each test
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});