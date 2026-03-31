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
