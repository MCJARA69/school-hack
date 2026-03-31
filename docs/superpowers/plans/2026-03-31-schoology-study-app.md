# Schoology Study App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local web app that scrapes Schoology for assignments/exams, shows a priority dashboard, and lets the user study with Claude-generated lessons and practice problems — plus a coin rewards system.

**Architecture:** Node.js/Express backend handles Schoology scraping (Puppeteer), Claude API calls, and JSON file persistence. React frontend has three screens: Login, Dashboard, Study Mode. All communication is over HTTP to localhost:3001.

**Tech Stack:** Node.js 20+, Express, TypeScript, Puppeteer, Anthropic SDK (`@anthropic-ai/sdk`), React 18, Tailwind CSS, Vite, Vitest

---

## File Structure

```
schoology-study-app/
├── client/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx               # Router: Login / Dashboard / Study
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── StudyMode.tsx
│   │   └── api.ts                # fetch wrappers for all endpoints
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── server/
│   ├── src/
│   │   ├── index.ts              # Express app entry, mounts routes
│   │   ├── routes.ts             # All route handlers
│   │   ├── scraper.ts            # Puppeteer Schoology scraper
│   │   ├── claude.ts             # Anthropic API calls
│   │   ├── cache.ts              # Read/write data/assignments.json
│   │   ├── rewards.ts            # Read/write data/rewards.json, coin logic
│   │   └── sessions.ts           # In-memory StudySession store
│   ├── package.json
│   └── tsconfig.json
├── data/                         # gitignored — runtime data
├── .env                          # ANTHROPIC_API_KEY — gitignored
├── .gitignore
└── package.json                  # root: scripts to start both client + server
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json` (root)
- Create: `.gitignore`
- Create: `.env` (template only — no real secrets)
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `client/package.json`
- Create: `client/vite.config.ts`
- Create: `client/index.html`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "schoology-study-app",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix server\" \"npm run dev --prefix client\"",
    "install:all": "npm install && npm install --prefix server && npm install --prefix client"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

- [ ] **Step 2: Create .gitignore**

```
node_modules/
data/
.env
dist/
.superpowers/
```

- [ ] **Step 3: Create .env template**

```
ANTHROPIC_API_KEY=your_key_here
```

- [ ] **Step 4: Create server/package.json**

```json
{
  "name": "schoology-study-server",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "express": "^4.18.2",
    "puppeteer": "^22.0.0",
    "uuid": "^9.0.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/uuid": "^9.0.7",
    "@types/node": "^20.0.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "vitest": "^1.3.0"
  }
}
```

- [ ] **Step 5: Create server/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true
  },
  "include": ["src"]
}
```

- [ ] **Step 6: Create client/package.json**

```json
{
  "name": "schoology-study-client",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3",
    "vite": "^5.1.1"
  }
}
```

- [ ] **Step 7: Create client/vite.config.ts**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
```

- [ ] **Step 8: Create client/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Study Planner</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 9: Create client/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
```

- [ ] **Step 10: Install dependencies**

```bash
npm run install:all
```

Expected: all three `node_modules/` folders created without errors.

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "chore: project scaffold"
```

---

## Task 2: Server Entry + Types

**Files:**
- Create: `server/src/index.ts`
- Create: `server/src/types.ts`

- [ ] **Step 1: Create shared types**

`server/src/types.ts`:
```ts
export type Assignment = {
  id: string
  subject: string
  type: 'exam' | 'homework' | 'quiz'
  title: string
  dueDate: string   // ISO date string
  topic: string
}

export type Problem = {
  index: number
  question: string
}

export type StudySession = {
  sessionId: string
  assignmentId: string
  lesson: string
  problems: Problem[]
}

export type RewardsData = {
  coins: number
}

export type CacheData = {
  updatedAt: string   // ISO date string
  assignments: Assignment[]
}
```

- [ ] **Step 2: Create server entry point**

`server/src/index.ts`:
```ts
import express from 'express'
import cors from 'cors'
import { router } from './routes.js'

const app = express()
app.use(cors())
app.use(express.json())
app.use('/api', router)

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
```

- [ ] **Step 3: Verify server starts**

```bash
cd server && npx tsx src/index.ts
```

Expected: `Server running on http://localhost:3001`

- [ ] **Step 4: Commit**

```bash
git add server/src/
git commit -m "chore: server entry and shared types"
```

---

## Task 3: Cache Module

**Files:**
- Create: `server/src/cache.ts`
- Create: `server/src/tests/cache.test.ts`

- [ ] **Step 1: Write failing tests**

`server/src/tests/cache.test.ts`:
```ts
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
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd server && npx vitest run src/tests/cache.test.ts
```

Expected: FAIL — `cache.ts` not found.

- [ ] **Step 3: Implement cache module**

`server/src/cache.ts`:
```ts
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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd server && npx vitest run src/tests/cache.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add server/src/cache.ts server/src/tests/cache.test.ts
git commit -m "feat: cache module with TTL"
```

---

## Task 4: Rewards Module

**Files:**
- Create: `server/src/rewards.ts`
- Create: `server/src/tests/rewards.test.ts`

- [ ] **Step 1: Write failing tests**

`server/src/tests/rewards.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
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
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd server && npx vitest run src/tests/rewards.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement rewards module**

`server/src/rewards.ts`:
```ts
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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd server && npx vitest run src/tests/rewards.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add server/src/rewards.ts server/src/tests/rewards.test.ts
git commit -m "feat: rewards/coin system"
```

---

## Task 5: Sessions Module

**Files:**
- Create: `server/src/sessions.ts`
- Create: `server/src/tests/sessions.test.ts`

- [ ] **Step 1: Write failing tests**

`server/src/tests/sessions.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { createSession, getSession } from '../sessions.js'
import type { Problem } from '../types.js'

const problems: Problem[] = [
  { index: 0, question: 'What is 2x + 3 = 7?' },
  { index: 1, question: 'Factor x² + 5x + 6' },
]

describe('sessions', () => {
  it('creates and retrieves a session', () => {
    const session = createSession('assignment-1', 'Here is your lesson', problems)
    const retrieved = getSession(session.sessionId)
    expect(retrieved).toEqual(session)
  })

  it('returns undefined for unknown sessionId', () => {
    expect(getSession('does-not-exist')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd server && npx vitest run src/tests/sessions.test.ts
```

- [ ] **Step 3: Implement sessions module**

`server/src/sessions.ts`:
```ts
import { v4 as uuidv4 } from 'uuid'
import type { StudySession, Problem } from './types.js'

const sessions = new Map<string, StudySession>()

export function createSession(assignmentId: string, lesson: string, problems: Problem[]): StudySession {
  const session: StudySession = {
    sessionId: uuidv4(),
    assignmentId,
    lesson,
    problems,
  }
  sessions.set(session.sessionId, session)
  return session
}

export function getSession(sessionId: string): StudySession | undefined {
  return sessions.get(sessionId)
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd server && npx vitest run src/tests/sessions.test.ts
```

Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add server/src/sessions.ts server/src/tests/sessions.test.ts
git commit -m "feat: in-memory study session store"
```

---

## Task 6: Claude Module

**Files:**
- Create: `server/src/claude.ts`

No unit tests here — Claude API calls are integration-only. We'll test via the route in Task 8.

- [ ] **Step 1: Implement Claude module**

`server/src/claude.ts`:
```ts
import Anthropic from '@anthropic-ai/sdk'
import type { Assignment, Problem } from './types.js'

const client = new Anthropic()

const STUDENT_CONTEXT = '16-year-old student with ADHD. Needs short clear explanations, no jargon, use examples and analogies. Keep it simple.'

export async function generateLesson(assignment: Assignment): Promise<{ lesson: string; problems: Problem[] }> {
  const prompt = `You are a patient tutor helping a student prepare for an upcoming ${assignment.type}.

Student context: ${STUDENT_CONTEXT}

Subject: ${assignment.subject}
Topic: ${assignment.topic}
Assignment: "${assignment.title}" due ${assignment.dueDate}

First, write a clear 2-3 minute lesson explaining the key concepts the student needs to know. Use simple language and 1-2 concrete examples.

Then, write exactly 5 practice problems at appropriate difficulty. Number them 1-5.

Format your response exactly like this:
LESSON:
[your lesson here]

PROBLEMS:
1. [problem 1]
2. [problem 2]
3. [problem 3]
4. [problem 4]
5. [problem 5]`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const [lessonPart, problemsPart] = text.split('PROBLEMS:')
  const lesson = lessonPart.replace('LESSON:', '').trim()

  const problems: Problem[] = (problemsPart ?? '')
    .trim()
    .split('\n')
    .filter(line => /^\d+\./.test(line.trim()))
    .map((line, index) => ({
      index,
      question: line.replace(/^\d+\.\s*/, '').trim(),
    }))

  return { lesson, problems }
}

export async function checkAnswer(
  question: string,
  answer: string,
  subject: string
): Promise<{ correct: boolean; explanation: string }> {
  const prompt = `You are evaluating a student's answer to a ${subject} problem.

Student context: ${STUDENT_CONTEXT}

Question: ${question}
Student's answer: ${answer}

Is the answer correct? Reply with:
CORRECT: yes or no
EXPLANATION: [explain whether they got it right and show the full solution step-by-step]`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const correctMatch = text.match(/CORRECT:\s*(yes|no)/i)
  const explanationMatch = text.match(/EXPLANATION:\s*([\s\S]+)/)

  return {
    correct: correctMatch?.[1]?.toLowerCase() === 'yes' ?? false,
    explanation: explanationMatch?.[1]?.trim() ?? text,
  }
}
```

- [ ] **Step 2: Verify ANTHROPIC_API_KEY is set**

```bash
echo $ANTHROPIC_API_KEY
```

Expected: your key printed (not empty). If empty, add it to `.env` and re-source.

- [ ] **Step 3: Commit**

```bash
git add server/src/claude.ts
git commit -m "feat: Claude lesson and answer-check integration"
```

---

## Task 7: Scraper Module

**Files:**
- Create: `server/src/scraper.ts`

No unit tests — Puppeteer requires a real browser and live Schoology credentials. Manual test in Task 8.

- [ ] **Step 1: Implement scraper**

`server/src/scraper.ts`:
```ts
import puppeteer from 'puppeteer'
import { v4 as uuidv4 } from 'uuid'
import type { Assignment } from './types.js'

export async function scrapeSchoology(username: string, password: string): Promise<Assignment[]> {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto('https://app.schoology.com/login', { waitUntil: 'networkidle2' })
    await page.type('#edit-mail', username)
    await page.type('#edit-pass', password)
    await page.click('#edit-submit')
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 })

    // Check for login failure
    const errorEl = await page.$('.messages.error')
    if (errorEl) {
      throw new Error('Invalid username or password')
    }

    // Navigate to upcoming events
    await page.goto('https://app.schoology.com/home?filter=upcoming', { waitUntil: 'networkidle2' })

    const assignments: Assignment[] = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.s-edge-feed-item, .event-row, [data-item-type]'))
      return items.map((el) => {
        const title = el.querySelector('.title, .event-title, h3')?.textContent?.trim() ?? 'Untitled'
        const subject = el.querySelector('.course-title, .course-name')?.textContent?.trim() ?? 'Unknown'
        const dueDateText = el.querySelector('.due-date, .event-date, time')?.textContent?.trim() ?? ''
        const typeText = title.toLowerCase()

        let type: 'exam' | 'homework' | 'quiz' = 'homework'
        if (typeText.includes('exam') || typeText.includes('test')) type = 'exam'
        else if (typeText.includes('quiz')) type = 'quiz'

        // Deterministic ID so it survives re-scrapes
        const idSource = `${subject}|${title}|${dueDateText}`
        const id = btoa(idSource).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)
        return { id, subject, type, title, dueDate: dueDateText, topic: title }
      }).filter(a => a.subject !== 'Unknown')
    })

    return assignments
  } finally {
    await browser.close()
  }
}
```

> **Note:** Schoology's DOM selectors may need adjustment after first run. If assignments come back empty, use `page.content()` to inspect the actual HTML and update the selectors in `page.evaluate()`.

- [ ] **Step 2: Commit**

```bash
git add server/src/scraper.ts
git commit -m "feat: Puppeteer Schoology scraper"
```

---

## Task 8: API Routes

**Files:**
- Create: `server/src/routes.ts`

- [ ] **Step 1: Implement all routes**

`server/src/routes.ts`:
```ts
import { Router } from 'express'
import type { Request, Response } from 'express'
import { scrapeSchoology } from './scraper.js'
import { generateLesson, checkAnswer } from './claude.js'
import { readCache, writeCache, isCacheStale } from './cache.js'
import { createSession, getSession } from './sessions.js'
import { getCoins, addCoins, COIN_VALUES } from './rewards.js'
import type { Assignment } from './types.js'
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
    const assignment = allAssignments.find(a => a.id === session.assignmentId)
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
```

- [ ] **Step 2: Start server and smoke-test**

```bash
cd server && npx tsx src/index.ts
```

In a second terminal:
```bash
curl http://localhost:3001/api/rewards
```

Expected: `{"coins":0}`

- [ ] **Step 3: Commit**

```bash
git add server/src/routes.ts server/src/index.ts
git commit -m "feat: all API routes"
```

---

## Task 9: React Client — Scaffold + API Layer

**Files:**
- Create: `client/src/main.tsx`
- Create: `client/src/App.tsx`
- Create: `client/src/api.ts`
- Create: `client/src/index.css`
- Create: `client/tailwind.config.js`
- Create: `client/postcss.config.js`

- [ ] **Step 1: Set up Tailwind**

`client/tailwind.config.js`:
```js
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

`client/postcss.config.js`:
```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
```

`client/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 2: Create API module**

`client/src/api.ts`:
```ts
export type Assignment = {
  id: string
  subject: string
  type: 'exam' | 'homework' | 'quiz'
  title: string
  dueDate: string
  topic: string
}

export type Problem = {
  index: number
  question: string
}

export async function sync(username: string, password: string): Promise<void> {
  const res = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error ?? 'Sync failed')
  }
}

export async function getAssignments(): Promise<Assignment[]> {
  const res = await fetch('/api/assignments')
  if (res.status === 401) throw new Error('SESSION_EXPIRED')
  if (!res.ok) throw new Error('Failed to fetch assignments')
  return res.json()
}

export async function startStudy(assignmentId: string): Promise<{
  sessionId: string; lesson: string; problems: Problem[]
}> {
  const res = await fetch('/api/study', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignmentId }),
  })
  if (!res.ok) throw new Error('Failed to start study session')
  return res.json()
}

export async function checkAnswer(sessionId: string, problemIndex: number, answer: string): Promise<{
  correct: boolean; explanation: string; coinsEarned: number
}> {
  const res = await fetch('/api/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, problemIndex, answer }),
  })
  if (!res.ok) throw new Error('Failed to check answer')
  return res.json()
}

export async function getCoins(): Promise<number> {
  const res = await fetch('/api/rewards')
  if (!res.ok) return 0
  const data = await res.json()
  return data.coins
}
```

- [ ] **Step 3: Create App.tsx with routing**

`client/src/App.tsx`:
```tsx
import { useState } from 'react'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { StudyMode } from './pages/StudyMode'
import type { Assignment } from './api'

type Screen = 'login' | 'dashboard' | 'study'

export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)

  if (screen === 'login') {
    return <Login onSuccess={() => setScreen('dashboard')} />
  }

  if (screen === 'study' && selectedAssignment) {
    return (
      <StudyMode
        assignment={selectedAssignment}
        onBack={() => setScreen('dashboard')}
      />
    )
  }

  return (
    <Dashboard
      onStudy={(assignment) => {
        setSelectedAssignment(assignment)
        setScreen('study')
      }}
      onSessionExpired={() => setScreen('login')}
    />
  )
}
```

`client/src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 4: Commit**

```bash
git add client/src/ client/tailwind.config.js client/postcss.config.js
git commit -m "feat: React scaffold, API client, routing"
```

---

## Task 10: Login Page

**Files:**
- Create: `client/src/pages/Login.tsx`

- [ ] **Step 1: Implement Login page**

`client/src/pages/Login.tsx`:
```tsx
import { useState } from 'react'
import { sync } from '../api'

export function Login({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await sync(username, password)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-2">Study Planner</h1>
        <p className="text-slate-400 mb-8">Log in with your Schoology account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username or email"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full bg-slate-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-slate-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-3"
          >
            {loading ? 'Connecting to Schoology...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Start both servers and verify login screen renders**

```bash
# Terminal 1
cd server && npx tsx src/index.ts

# Terminal 2
cd client && npx vite
```

Open `http://localhost:5173` — should see the login form.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Login.tsx
git commit -m "feat: Login page"
```

---

## Task 11: Dashboard Page

**Files:**
- Create: `client/src/pages/Dashboard.tsx`

- [ ] **Step 1: Implement Dashboard**

`client/src/pages/Dashboard.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { getAssignments, getCoins } from '../api'
import type { Assignment } from '../api'

function urgencyColor(dueDate: string): { bg: string; border: string; label: string } {
  const daysUntil = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (daysUntil <= 1) return { bg: 'bg-red-950', border: 'border-red-500', label: 'text-red-400' }
  if (daysUntil <= 7) return { bg: 'bg-yellow-950', border: 'border-yellow-500', label: 'text-yellow-400' }
  return { bg: 'bg-slate-800', border: 'border-green-500', label: 'text-green-400' }
}

function urgencyDot(dueDate: string): string {
  const daysUntil = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (daysUntil <= 1) return '🔴'
  if (daysUntil <= 7) return '🟡'
  return '🟢'
}

function formatDue(dueDate: string): string {
  const daysUntil = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (daysUntil <= 0) return 'TODAY'
  if (daysUntil === 1) return 'TOMORROW'
  if (daysUntil <= 7) return `IN ${daysUntil} DAYS`
  return new Date(dueDate).toLocaleDateString()
}

export function Dashboard({
  onStudy,
  onSessionExpired,
}: {
  onStudy: (a: Assignment) => void
  onSessionExpired: () => void
}) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [coins, setCoins] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getAssignments(), getCoins()])
      .then(([a, c]) => {
        setAssignments(a)
        setCoins(c)
      })
      .catch(err => {
        if (err.message === 'SESSION_EXPIRED') onSessionExpired()
        else setError('Failed to load assignments')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <p className="text-slate-400">Loading your assignments...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">What needs your attention</h1>
        <span className="bg-yellow-500 text-yellow-950 font-bold px-3 py-1 rounded-full text-sm">
          🪙 {coins}
        </span>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <div className="space-y-3">
        {assignments.length === 0 && (
          <p className="text-slate-400 text-center py-8">Nothing due. You're good!</p>
        )}
        {assignments.map(a => {
          const colors = urgencyColor(a.dueDate)
          return (
            <button
              key={a.id}
              onClick={() => onStudy(a)}
              className={`w-full text-left rounded-lg p-4 border-l-4 ${colors.bg} ${colors.border} hover:opacity-90 transition-opacity`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wide ${colors.label}`}>
                    {urgencyDot(a.dueDate)} {a.subject} — {a.type.toUpperCase()}
                  </p>
                  <p className="text-white font-medium mt-1">{a.title}</p>
                </div>
                <p className={`text-xs font-bold ${colors.label} ml-4 whitespace-nowrap`}>
                  {formatDue(a.dueDate)}
                </p>
              </div>
              <p className="text-slate-400 text-xs mt-2">Tap to study →</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/Dashboard.tsx
git commit -m "feat: Dashboard — priority list with urgency colors and coin display"
```

---

## Task 12: Study Mode Page

**Files:**
- Create: `client/src/pages/StudyMode.tsx`

- [ ] **Step 1: Implement StudyMode**

`client/src/pages/StudyMode.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { startStudy, checkAnswer } from '../api'
import type { Assignment, Problem } from '../api'

type Phase = 'loading' | 'lesson' | 'practice' | 'done'

export function StudyMode({ assignment, onBack }: { assignment: Assignment; onBack: () => void }) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [sessionId, setSessionId] = useState('')
  const [lesson, setLesson] = useState('')
  const [problems, setProblems] = useState<Problem[]>([])
  const [currentProblem, setCurrentProblem] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation: string; coinsEarned: number } | null>(null)
  const [totalCoins, setTotalCoins] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    startStudy(assignment.id)
      .then(data => {
        setSessionId(data.sessionId)
        setLesson(data.lesson)
        setProblems(data.problems)
        setPhase('lesson')
      })
      .catch(() => setError('Failed to load lesson. Check your API key.'))
  }, [assignment.id])

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return
    try {
      const result = await checkAnswer(sessionId, currentProblem, answer)
      setFeedback(result)
      setTotalCoins(c => c + result.coinsEarned)
    } catch {
      setError('Failed to check answer')
    }
  }

  const handleNext = () => {
    setFeedback(null)
    setAnswer('')
    if (currentProblem + 1 >= problems.length) {
      setPhase('done')
    } else {
      setCurrentProblem(i => i + 1)
    }
  }

  if (error) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={onBack} className="text-slate-400 underline">← Back</button>
      </div>
    </div>
  )

  if (phase === 'loading') return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <p className="text-slate-400">Claude is preparing your lesson...</p>
    </div>
  )

  if (phase === 'done') return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <p className="text-4xl mb-4">🎉</p>
        <h2 className="text-2xl font-bold text-white mb-2">Session complete!</h2>
        <p className="text-yellow-400 text-lg mb-6">+{totalCoins} coins earned this session</p>
        <button
          onClick={onBack}
          className="bg-blue-600 text-white font-semibold rounded-lg px-6 py-3"
        >
          Back to dashboard
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 max-w-lg mx-auto">
      <button onClick={onBack} className="text-slate-400 text-sm mb-4 hover:text-white">
        ← Back to dashboard
      </button>

      <div className="mb-4">
        <p className="text-xs text-slate-400 uppercase tracking-wide">{assignment.subject}</p>
        <h2 className="text-lg font-bold">{assignment.title}</h2>
      </div>

      {phase === 'lesson' && (
        <div>
          <div className="bg-slate-800 rounded-lg p-4 mb-6 whitespace-pre-wrap text-slate-200 leading-relaxed text-sm">
            {lesson}
          </div>
          <button
            onClick={() => setPhase('practice')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-3"
          >
            Got it — start practice problems →
          </button>
        </div>
      )}

      {phase === 'practice' && (
        <div>
          <p className="text-xs text-slate-400 mb-4">
            Problem {currentProblem + 1} of {problems.length}
          </p>
          <div className="bg-slate-800 rounded-lg p-4 mb-4">
            <p className="text-white">{problems[currentProblem]?.question}</p>
          </div>

          {!feedback ? (
            <div className="space-y-3">
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={3}
                className="w-full bg-slate-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <button
                onClick={handleSubmitAnswer}
                disabled={!answer.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg py-3"
              >
                Submit answer
              </button>
            </div>
          ) : (
            <div>
              <div className={`rounded-lg p-4 mb-4 ${feedback.correct ? 'bg-green-950 border border-green-500' : 'bg-red-950 border border-red-500'}`}>
                <p className="font-bold mb-2">{feedback.correct ? '✅ Correct!' : '❌ Not quite'}</p>
                {feedback.coinsEarned > 0 && (
                  <p className="text-yellow-400 text-sm mb-2">+{feedback.coinsEarned} coins 🪙</p>
                )}
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{feedback.explanation}</p>
              </div>
              <button
                onClick={handleNext}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-3"
              >
                {currentProblem + 1 >= problems.length ? 'Finish session' : 'Next problem →'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run both servers, log in, pick a subject, and verify lesson loads**

```bash
npm run dev  # from root
```

Open `http://localhost:5173`, log in, tap an assignment, verify lesson appears.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/StudyMode.tsx
git commit -m "feat: Study Mode — lesson + practice problems + coin rewards"
```

---

## Task 13: End-to-End Smoke Test

- [ ] **Step 1: Run all server unit tests**

```bash
cd server && npx vitest run
```

Expected: all tests pass.

- [ ] **Step 2: Full manual flow**

1. Start both servers: `npm run dev` from root
2. Open `http://localhost:5173`
3. Log in with real Schoology credentials
4. Verify assignments appear on Dashboard
5. Tap an assignment — verify lesson loads
6. Click through all 5 problems, submit answers
7. Verify coins update on completion screen
8. Return to Dashboard — verify coin total updated in header

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat: complete schoology study app v1"
```
