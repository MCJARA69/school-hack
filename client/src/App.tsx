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
