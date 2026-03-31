import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import { readCache, writeCache, isCacheStale } from '../cache.js'

const TEST_CACHE_PATH = path.join(process.cwd(), 'data/test-cache.json')

beforeEach(async () => {
  await fs.mkdir(path.dirname(TEST_CACHE_PATH), { recursive: true })
})

afterEach(async () => {
  await fs.rm(TEST_CACHE_PATH, { force: true })
})

describe('isCacheStale', () => {
  it('returns true when file does not exist', async () => {
    expect(await isCacheStale(TEST_CACHE_PATH)).toBe(true)
  })

  it('returns false when updatedAt is less than 24h ago', async () => {
    const data = { updatedAt: new Date().toISOString(), assignments: [] }
    await fs.writeFile(TEST_CACHE_PATH, JSON.stringify(data))
    expect(await isCacheStale(TEST_CACHE_PATH)).toBe(false)
  })

  it('returns true when updatedAt is more than 24h ago', async () => {
    const old = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    const data = { updatedAt: old, assignments: [] }
    await fs.writeFile(TEST_CACHE_PATH, JSON.stringify(data))
    expect(await isCacheStale(TEST_CACHE_PATH)).toBe(true)
  })
})

describe('writeCache / readCache', () => {
  it('round-trips assignments correctly', async () => {
    const assignments = [{
      id: '1', subject: 'Algebra II', type: 'exam' as const,
      title: 'Chapter 3 Exam', dueDate: '2026-04-01', topic: 'Quadratics'
    }]
    await writeCache(TEST_CACHE_PATH, assignments)
    const result = await readCache(TEST_CACHE_PATH)
    expect(result).toEqual(assignments)
  })
})
