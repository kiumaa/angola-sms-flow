import '@testing-library/jest-dom'

// Add vitest globals
import { expect, test, describe, it, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'

// Make vitest globals available
declare global {
  const expect: typeof import('vitest').expect
  const test: typeof import('vitest').test
  const describe: typeof import('vitest').describe
  const it: typeof import('vitest').it
  const vi: typeof import('vitest').vi
  const beforeAll: typeof import('vitest').beforeAll
  const afterAll: typeof import('vitest').afterAll
  const beforeEach: typeof import('vitest').beforeEach
  const afterEach: typeof import('vitest').afterEach
}