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
