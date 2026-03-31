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

## Architecture

**Frontend:** React + TypeScript + Tailwind CSS (placeholder UI, to be redesigned)
**Backend:** Node.js + Express + TypeScript running on `localhost:3001`
**Scraping:** Puppeteer (headless Chrome) — logs into Schoology with user credentials
**AI:** Anthropic Claude API — generates lessons and practice problems
**Storage:** Local JSON file cache (`data/assignments.json`) — refreshed once per day

## Screens

### 1. Login
- Input for Schoology username and password
- Credentials stored in local `.env` file, never sent to any cloud service
- On submit: triggers Schoology scrape, redirects to Dashboard

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

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/sync` | Triggers Puppeteer scrape of Schoology, saves to cache |
| GET | `/api/assignments` | Returns cached assignments + exams sorted by due date |
| POST | `/api/study` | Sends subject + topic to Claude, returns lesson + 5 problems |
| POST | `/api/check` | Sends user's answer to Claude, returns feedback |

## Data Model

```ts
type Assignment = {
  id: string
  subject: string        // e.g. "Algebra II"
  type: 'exam' | 'homework' | 'quiz'
  title: string
  dueDate: string        // ISO date string
  topic?: string         // e.g. "Quadratic equations" — extracted from title if possible
}
```

## Schoology Scraping

- Uses Puppeteer to log in at `app.schoology.com`
- Navigates to each course section and scrapes upcoming items
- Credentials: stored in local `.env` as `SCHOOLOGY_USER` and `SCHOOLOGY_PASS`
- Cache TTL: 24 hours — re-scrapes on first load of the day

## Claude Integration

- Model: `claude-sonnet-4-6`
- Lesson prompt: given subject, topic, and student context (ADHD, struggling, needs simple explanations)
- Practice prompt: generates 5 problems at appropriate difficulty, one at a time
- Answer check prompt: evaluates user answer, returns correct/incorrect + full explanation

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

## Security

- `.env` and `data/` are gitignored — credentials and scraped data never leave the machine
- No authentication layer needed — it's a local-only tool
- Claude API key stored in `.env` as `ANTHROPIC_API_KEY`
