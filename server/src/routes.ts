import { Router } from 'express'
import type { Request, Response } from 'express'
import { scrapeSchoology } from './scraper.js'
import { generateLesson, checkAnswer } from './claude.js'
import { readCache, writeCache, isCacheStale } from './cache.js'
import { createSession, getSession } from './sessions.js'
import { getCoins, addCoins, COIN_VALUES } from './rewards.js'
import type { Assignment, StudySession } from './types.js'
import path from 'path'

export const router = Router()

// In-memory credential store for TTL re-scrape
let cachedCredentials: { username: string; password: string } | null = null
const CACHE_PATH = path.join(process.cwd(), '../data/assignments.json')
const REWARDS_PATH = path.join(process.cwd(), '../data/rewards.json')

// POST /api/sync
router.post('/sync', async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string }
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' })
  }
  try {
    const assignments = await scrapeSchoology(username, password)
    await writeCache(CACHE_PATH, assignments)
    cachedCredentials = { username, password }
    return res.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scrape failed'
    return res.status(401).json({ error: message })
  }
})

// GET /api/assignments
router.get('/assignments', async (_req: Request, res: Response) => {
  const stale = await isCacheStale(CACHE_PATH)
  if (stale) {
    if (!cachedCredentials) {
      return res.status(401).json({ error: 'Session expired, please log in again' })
    }
    try {
      const assignments = await scrapeSchoology(cachedCredentials.username, cachedCredentials.password)
      await writeCache(CACHE_PATH, assignments)
    } catch {
      return res.status(500).json({ error: 'Failed to refresh assignments' })
    }
  }
  const assignments = await readCache(CACHE_PATH)
  const sorted = sortAssignments(assignments)
  return res.json(sorted)
})

function sortAssignments(assignments: Assignment[]): Assignment[] {
  const typeRank = { exam: 0, quiz: 1, homework: 2 }
  return [...assignments].sort((a, b) => {
    const dateDiff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    if (dateDiff !== 0) return dateDiff
    return typeRank[a.type] - typeRank[b.type]
  })
}

// POST /api/study
router.post('/study', async (req: Request, res: Response) => {
  const { assignmentId } = req.body as { assignmentId?: string }
  if (!assignmentId) return res.status(400).json({ error: 'assignmentId required' })

  let assignment: Assignment | undefined
  try {
    const assignments = await readCache(CACHE_PATH)
    assignment = assignments.find(a => a.id === assignmentId)
  } catch {
    return res.status(500).json({ error: 'Could not read assignments' })
  }

  if (!assignment) return res.status(404).json({ error: 'Assignment not found' })

  try {
    const { lesson, problems } = await generateLesson(assignment)
    const session = createSession(assignmentId, lesson, problems)
    await addCoins(COIN_VALUES.LESSON_COMPLETE, REWARDS_PATH)
    return res.json({ sessionId: session.sessionId, lesson, problems })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Claude error'
    return res.status(500).json({ error: message })
  }
})

// POST /api/check
router.post('/check', async (req: Request, res: Response) => {
  const { sessionId, problemIndex, answer } = req.body as {
    sessionId?: string; problemIndex?: number; answer?: string
  }
  if (!sessionId || problemIndex === undefined || !answer) {
    return res.status(400).json({ error: 'sessionId, problemIndex, and answer required' })
  }

  const session = getSession(sessionId)
  if (!session) return res.status(404).json({ error: 'Session not found' })

  const problem = session.problems[problemIndex]
  if (!problem) return res.status(404).json({ error: 'Problem not found' })

  let allAssignments: Assignment[] = []
  try { allAssignments = await readCache(CACHE_PATH) } catch { /* ignore */ }
  const assignment = allAssignments.find(a => a.id === session.assignmentId)
  const subject = assignment?.subject ?? 'this subject'

  // Track whether this problem was previously answered wrong (for retry bonus)
  const previouslyWrong = (session as StudySession & { wrongAttempts?: Set<number> })
    .wrongAttempts?.has(problemIndex) ?? false

  try {
    const result = await checkAnswer(problem.question, answer, subject)

    let coinsEarned = 0
    if (result.correct && !previouslyWrong) {
      coinsEarned += COIN_VALUES.CORRECT_ANSWER
    } else if (result.correct && previouslyWrong) {
      coinsEarned += COIN_VALUES.RETRY_CORRECT
    } else {
      // Wrong — mark this problem so retry bonus applies next time
      const s = session as StudySession & { wrongAttempts?: Set<number> }
      s.wrongAttempts = s.wrongAttempts ?? new Set()
      s.wrongAttempts.add(problemIndex)
    }
    if (coinsEarned > 0) await addCoins(coinsEarned, REWARDS_PATH)

    // Bonus: session complete
    const isLast = problemIndex === session.problems.length - 1
    if (isLast) {
      coinsEarned += COIN_VALUES.SESSION_COMPLETE
      await addCoins(COIN_VALUES.SESSION_COMPLETE, REWARDS_PATH)
    }

    // Bonus: studying the day before an exam
    if (assignment?.type === 'exam') {
      const daysUntil = Math.ceil((new Date(assignment.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      if (daysUntil <= 1 && problemIndex === 0 && !previouslyWrong) {
        coinsEarned += COIN_VALUES.PRE_EXAM_STUDY
        await addCoins(COIN_VALUES.PRE_EXAM_STUDY, REWARDS_PATH)
      }
    }

    return res.json({ ...result, coinsEarned })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Claude error'
    return res.status(500).json({ error: message })
  }
})

// GET /api/rewards
router.get('/rewards', async (_req: Request, res: Response) => {
  const coins = await getCoins(REWARDS_PATH)
  return res.json({ coins })
})
