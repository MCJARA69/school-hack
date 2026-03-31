import { promises as fs } from 'fs'
import path from 'path'
import type { RewardsData } from './types.js'

const DEFAULT_PATH = path.join(process.cwd(), '../data/rewards.json')

export const COIN_VALUES = {
  LESSON_COMPLETE: 10,
  CORRECT_ANSWER: 20,
  RETRY_CORRECT: 10,
  SESSION_COMPLETE: 50,
  PRE_EXAM_STUDY: 30,
} as const

export async function getCoins(filePath = DEFAULT_PATH): Promise<number> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const data: RewardsData = JSON.parse(raw)
    return data.coins
  } catch {
    return 0
  }
}

export async function addCoins(amount: number, filePath = DEFAULT_PATH): Promise<number> {
  const current = await getCoins(filePath)
  const next = current + amount
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify({ coins: next }, null, 2))
  return next
}
