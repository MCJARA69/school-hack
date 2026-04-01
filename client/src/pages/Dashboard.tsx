import { useEffect, useState } from 'react'
import { getAssignments, getCoins } from '../api'
import type { Assignment } from '../api'

function daysUntil(dueDate: string): number {
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function urgency(dueDate: string): 'red' | 'yellow' | 'green' {
  const d = daysUntil(dueDate)
  if (d <= 1) return 'red'
  if (d <= 7) return 'yellow'
  return 'green'
}

function formatDue(dueDate: string): string {
  const d = daysUntil(dueDate)
  if (d <= 0) return 'TODAY'
  if (d === 1) return 'TOMORROW'
  if (d <= 7) return `${d} DAYS`
  return new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const URGENCY_STYLES = {
  red: {
    border: '3px solid #ff4757',
    background: 'linear-gradient(90deg, rgba(255,71,87,0.1) 0%, rgba(21,28,44,0.9) 100%)',
    dot: '🔴',
    label: '#ff4757',
    badge: { background: '#ff4757', color: '#fff' },
  },
  yellow: {
    border: '3px solid #f7c948',
    background: 'linear-gradient(90deg, rgba(247,201,72,0.07) 0%, rgba(21,28,44,0.9) 100%)',
    dot: '🟡',
    label: '#f7c948',
    badge: { background: '#f7c948', color: '#0a0e1a' },
  },
  green: {
    border: '3px solid #2ecc71',
    background: 'linear-gradient(90deg, rgba(46,204,113,0.05) 0%, rgba(21,28,44,0.9) 100%)',
    dot: '🟢',
    label: '#2ecc71',
    badge: { background: 'transparent', color: '#2ecc71', outline: '1px solid #2ecc71' },
  },
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
        if (err instanceof Error && err.message === 'SESSION_EXPIRED') onSessionExpired()
        else setError('Failed to load assignments')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0e1a' }}>
        <p className="text-white/40 tracking-widest uppercase text-sm" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Loading battle plan...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto" style={{ background: '#0a0e1a', fontFamily: "'Barlow Condensed', sans-serif" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-white font-black tracking-widest uppercase text-xl">BATTLE PLAN</div>
          <div className="text-white/40 text-xs tracking-widest uppercase">What needs your attention</div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5" style={{
          background: '#151c2c',
          border: '1px solid rgba(247,201,72,0.3)',
          borderRadius: '2px',
        }}>
          <div style={{
            width: 14, height: 14,
            background: 'radial-gradient(circle at 35% 35%, #ffd700, #f7c948, #b8860b)',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.3)',
          }} />
          <span className="font-black tracking-wide text-sm" style={{ color: '#f7c948' }}>{coins}</span>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm tracking-wide uppercase mb-4">{error}</p>}

      {/* Assignment list */}
      <div className="flex flex-col gap-2.5">
        {assignments.length === 0 && !error && (
          <p className="text-white/30 text-center py-12 tracking-widest uppercase text-sm">
            Nothing due — you're good.
          </p>
        )}
        {assignments.map(a => {
          const u = urgency(a.dueDate)
          const s = URGENCY_STYLES[u]
          return (
            <button
              key={a.id}
              onClick={() => onStudy(a)}
              className="w-full text-left relative overflow-hidden"
              style={{
                background: s.background,
                borderLeft: s.border,
                borderTop: '1px solid rgba(255,255,255,0.04)',
                borderRight: '1px solid rgba(255,255,255,0.04)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '2px',
                padding: '12px 14px',
              }}
            >
              {/* Top highlight */}
              <span className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.06) 0%, transparent 100%)' }} />

              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: s.label }}>
                    {s.dot} {a.subject} · {a.type.toUpperCase()}
                  </div>
                  <div className="text-white font-bold tracking-wide text-sm truncate">{a.title}</div>
                  <div className="text-white/30 text-xs tracking-wide uppercase mt-1.5">Tap to study →</div>
                </div>
                <div className="font-black text-xs tracking-wider px-2 py-1 shrink-0" style={{
                  ...s.badge,
                  borderRadius: '2px',
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}>
                  {formatDue(a.dueDate)}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
