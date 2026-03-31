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
