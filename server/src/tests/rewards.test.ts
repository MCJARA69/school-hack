import { describe, it, expect, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import { getCoins, addCoins, COIN_VALUES } from '../rewards.js'

const TEST_PATH = path.join(process.cwd(), 'data/test-rewards.json')

afterEach(async () => {
  await fs.rm(TEST_PATH, { force: true })
})

describe('getCoins', () => {
  it('returns 0 when file does not exist', async () => {
    expect(await getCoins(TEST_PATH)).toBe(0)
  })
})

describe('addCoins', () => {
  it('creates file and adds coins', async () => {
    await addCoins(COIN_VALUES.CORRECT_ANSWER, TEST_PATH)
    expect(await getCoins(TEST_PATH)).toBe(COIN_VALUES.CORRECT_ANSWER)
  })

  it('accumulates coins across multiple calls', async () => {
    await addCoins(COIN_VALUES.LESSON_COMPLETE, TEST_PATH)
    await addCoins(COIN_VALUES.CORRECT_ANSWER, TEST_PATH)
    expect(await getCoins(TEST_PATH)).toBe(COIN_VALUES.LESSON_COMPLETE + COIN_VALUES.CORRECT_ANSWER)
  })
})
