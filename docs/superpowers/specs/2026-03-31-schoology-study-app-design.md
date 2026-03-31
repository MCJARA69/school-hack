# Schoology Study App — Design Spec
**Date:** 2026-03-31
**Status:** Approved

## Overview

A local web app for Emiliano (Master Academy, Miami) that pulls assignments and exam dates from Schoology and turns them into a prioritized study plan with Claude-powered lessons and practice problems. Built for someone with ADHD — minimal friction, maximum urgency clarity.

## Goals

- Show what's due soonest and most urgently, front and center
- Let Emiliano tap a subject and immediately start studying with Claude
- Avoid getting kicked out of school by never missing an exam or homework deadline

## Non-Goals

- Cloud hosting or multi-user support
- Grade tracking or GPA calculation
- Replacing Schoology — this is a study tool, not a school management tool
- Frontend polish (to be redesigned later)
- Real Fortnite skin integration (future business idea — v1 uses virtual coins only)

## Architecture

**Frontend:** React + TypeScript + Tailwind CSS (placeholder UI, to be redesigned)
**Backend:** Node.js + Express + TypeScript running on `localhost:3001`
**Scraping:** Puppeteer (headless Chrome) — logs into Schoology with user credentials
**AI:** Anthropic Claude API — generates lessons and practice problems
**Storage:** Local JSON file cache (`data/assignments.json`) — refreshed once per day

## Screens

### 1. Login
- Input for Schoology username and password
- Credentials are sent to `/api/sync` at runtime and never written to disk
- On submit: triggers Schoology scrape, redirects to Dashboard on success; shows inline error on failure

### 2. Dashboard (Most Urgent First)
- List of all upcoming assignments and exams sorted by due date
- Color coding: 🔴 red = due tomorrow or less, 🟡 yellow = due this week, 🟢 green = more than a week out
- Each item shows: subject name, type (exam/homework), due date
- Tap any item → Study Mode for that subject

### 3. Study Mode
- Shows subject name and upcoming item (e.g. "Algebra II — Exam tomorrow")
- **Step 1 — Lesson:** Claude generates a 2–3 min explanation of the topic. User reads it.
- **Step 2 — Practice:** Claude generates 5 practice problems. User answers each one.
- After each answer: instant feedback + step-by-step explanation if wrong
- "Back to dashboard" button always visible

## Backend API Endpoints

| Method | Path | Request body | Response |
|--------|------|--------------|----------|
| POST | `/api/sync` | `{ username, password }` | `{ ok: true }` or `{ error: string }` |
| GET | `/api/assignments` | — | `Assignment[]` sorted by due date (exams before homework on same day) |
| POST | `/api/study` | `{ assignmentId }` | `{ sessionId: string, lesson: string, problems: Problem[] }` |
| POST | `/api/check` | `{ sessionId, problemIndex, answer }` | `{ correct: boolean, explanation: string }` |

## Data Model

```ts
type Assignment = {
  id: string
  subject: string        // e.g. "Algebra II"
  type: 'exam' | 'homework' | 'quiz'
  title: string
  dueDate: string        // ISO date string
  topic: string          // extracted from title, or falls back to subject name
}

type Problem = {
  index: number
  question: string
}

type StudySession = {
  sessionId: string      // uuid, created per /api/study call
  assignmentId: string
  lesson: string
  problems: Problem[]
}
```

## Schoology Scraping

- Login screen collects username + password at runtime and sends to `POST /api/sync`
- Credentials are NOT written to disk — passed directly to Puppeteer for the scrape, then discarded
- On wrong credentials or scrape failure, `/api/sync` returns `{ error: "..." }` and the Login screen shows an inline error message
- Cache TTL: server checks timestamp in `data/assignments.json` on every `GET /api/assignments` call. If cache is fresh (<24h), returns it immediately. If stale, checks for in-memory credentials (a module-level variable set on last `/api/sync` call) and re-scrapes. If stale AND no in-memory credentials (e.g. server restarted), returns `{ error: "Session expired, please log in again" }` with HTTP 401 — the client redirects to Login.
- `StudySession` objects accumulate in server memory and are never explicitly cleared — acceptable for a local single-user tool
- Sort order: same due date → exams ranked above quizzes above homework

## Claude Integration

- Model: `claude-sonnet-4-6`
- `/api/study`: generates lesson + 5 problems in one call. Creates a `StudySession` stored in server memory (keyed by `sessionId`) so the full context is available for answer checking.
- `/api/check`: looks up the `StudySession` by `sessionId`, finds the problem at `problemIndex`, sends the question + user answer to Claude for evaluation. Returns `{ correct, explanation }`.
- Session state lives in server memory only — if the server restarts, sessions reset (acceptable for a local tool).
- If `topic` cannot be extracted from the assignment title, Claude is asked to infer an appropriate topic from the subject name and assignment title alone.
- Student context injected into every prompt: "16-year-old student with ADHD, needs short clear explanations, no jargon, use examples."

## Tech Stack

```
schoology-study-app/
├── client/          # React + TypeScript + Tailwind
├── server/          # Node.js + Express + TypeScript
│   ├── scraper.ts   # Puppeteer Schoology scraper
│   ├── claude.ts    # Anthropic API calls
│   └── routes.ts    # Express endpoints
├── data/            # Local JSON cache (gitignored)
├── .env             # Credentials (gitignored)
└── package.json
```

## Rewards System

Every action earns coins, saved to `data/rewards.json`:

| Action | Coins |
|--------|-------|
| Complete a lesson (read through) | +10 |
| Answer a practice problem correctly | +20 |
| Answer incorrectly but retry and get it right | +10 |
| Complete all 5 problems in a session | +50 bonus |
| Study the day before an exam | +30 bonus |

Coins are displayed on the Dashboard header. No levels or streaks in v1 — just a running total. Future versions can add unlockable badges, streaks, and real reward integrations.

**New endpoint:**
| Method | Path | Request body | Response |
|--------|------|--------------|----------|
| GET | `/api/rewards` | — | `{ coins: number }` |

Coins are updated server-side when `/api/check` is called (correct answer) and when a study session is completed.

## Security

- `.env` and `data/` are gitignored — credentials and scraped data never leave the machine
- No authentication layer needed — it's a local-only tool
- Claude API key stored in `.env` as `ANTHROPIC_API_KEY`
