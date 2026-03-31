import { promises as fs } from 'fs'
import path from 'path'
import type { Assignment, CacheData } from './types.js'

const DEFAULT_PATH = path.join(process.cwd(), '../data/assignments.json')
const TTL_MS = 24 * 60 * 60 * 1000

export async function isCacheStale(filePath = DEFAULT_PATH): Promise<boolean> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const data: CacheData = JSON.parse(raw)
    return Date.now() - new Date(data.updatedAt).getTime() > TTL_MS
  } catch {
    return true
  }
}

export async function writeCache(filePath = DEFAULT_PATH, assignments: Assignment[]): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  const data: CacheData = { updatedAt: new Date().toISOString(), assignments }
  await fs.writeFile(filePath, JSON.stringify(data, null, 2))
}

export async function readCache(filePath = DEFAULT_PATH): Promise<Assignment[]> {
  const raw = await fs.readFile(filePath, 'utf-8')
  const data: CacheData = JSON.parse(raw)
  return data.assignments
}
