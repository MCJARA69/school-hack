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
