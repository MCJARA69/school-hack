import { useEffect, useState } from 'react'
import { startStudy, checkAnswer } from '../api'
import type { Assignment, Problem } from '../api'

type Phase = 'loading' | 'lesson' | 'practice' | 'done'

const FN_STYLE: React.CSSProperties = { fontFamily: "'Barlow Condensed', sans-serif" }

function ProgressPips({ total, current, done }: { total: number; current: number; done: number }) {
  return (
    <div className="flex gap-1 px-4 py-2" style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid #1e2d45' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="flex-1 h-1 rounded-sm"
          style={{
            background: i < done ? '#9b59f5' : i === current ? '#00d4ff' : 'rgba(255,255,255,0.1)',
            boxShadow: i === current ? '0 0 6px #00d4ff' : undefined,
          }}
        />
      ))}
    </div>
  )
}

export function StudyMode({ assignment, onBack }: { assignment: Assignment; onBack: () => void }) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [sessionId, setSessionId] = useState('')
  const [lesson, setLesson] = useState('')
  const [problems, setProblems] = useState<Problem[]>([])
  const [current, setCurrent] = useState(0)
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
      .catch(() => setError('Failed to load lesson. Check that ANTHROPIC_API_KEY is set.'))
  }, [assignment.id])

  const handleSubmit = async () => {
    if (!answer.trim()) return
    try {
      const result = await checkAnswer(sessionId, current, answer)
      setFeedback(result)
      setTotalCoins(c => c + result.coinsEarned)
    } catch {
      setError('Failed to check answer')
    }
  }

  const handleNext = () => {
    setFeedback(null)
    setAnswer('')
    if (current + 1 >= problems.length) {
      setPhase('done')
    } else {
      setCurrent(i => i + 1)
    }
  }

  const headerStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, #0a0e1a 0%, #0d1117 100%)',
    borderBottom: '1px solid #1e2d45',
    padding: '12px 16px',
  }

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0a0e1a', ...FN_STYLE }}>
      <div className="text-center">
        <p className="tracking-wide uppercase text-sm mb-4" style={{ color: '#ff4757' }}>{error}</p>
        <button onClick={onBack} className="text-white/40 tracking-widest uppercase text-xs underline">← Back</button>
      </div>
    </div>
  )

  if (phase === 'loading') return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0e1a', ...FN_STYLE }}>
      <p className="text-white/40 tracking-widest uppercase text-sm">Claude is loading your lesson...</p>
    </div>
  )

  if (phase === 'done') return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0a0e1a', ...FN_STYLE }}>
      <div className="text-center max-w-xs">
        <div className="text-5xl mb-4">🏆</div>
        <div className="text-3xl font-black tracking-widest uppercase mb-1 text-white">MISSION COMPLETE</div>
        <div className="text-sm tracking-widest mb-2" style={{ color: '#f7c948' }}>
          +{totalCoins} coins earned
        </div>
        <div className="text-white/30 text-xs tracking-widest uppercase mb-8">
          {assignment.subject} · {assignment.type}
        </div>
        <button
          onClick={onBack}
          className="px-8 py-3 font-black tracking-widest uppercase text-sm"
          style={{
            background: 'linear-gradient(180deg, #00d4ff 0%, #0095b3 100%)',
            border: 'none',
            borderRadius: '2px',
            color: '#0a0e1a',
          }}
        >
          Back to Battle Plan
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen max-w-lg mx-auto" style={{ background: '#0a0e1a', ...FN_STYLE }}>
      {/* Header */}
      <div style={headerStyle}>
        <button onClick={onBack} className="text-white/30 tracking-widest uppercase text-xs mb-2 hover:text-white/60">
          ← Back
        </button>
        <div className="text-xs tracking-widest uppercase mb-0.5" style={{ color: '#00d4ff' }}>
          {assignment.subject} · {assignment.type.toUpperCase()}
        </div>
        <div className="text-white font-black tracking-wide uppercase text-base">{assignment.title}</div>
      </div>

      {/* Progress pips (practice only) */}
      {phase === 'practice' && (
        <ProgressPips total={problems.length} current={current} done={current} />
      )}

      {/* Lesson phase */}
      {phase === 'lesson' && (
        <div className="p-4">
          <div className="text-xs tracking-widest uppercase mb-3" style={{ color: '#00d4ff' }}>
            📖 Your Lesson
          </div>
          <div
            className="text-sm leading-relaxed mb-5 p-4"
            style={{
              background: 'rgba(0,212,255,0.04)',
              border: '1px solid rgba(0,212,255,0.12)',
              borderRadius: '2px',
              color: 'rgba(255,255,255,0.8)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {lesson}
          </div>
          <button
            onClick={() => setPhase('practice')}
            className="w-full py-3 font-black tracking-widest uppercase text-sm relative overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #f7c948 0%, #d4a017 100%)',
              border: 'none',
              borderRadius: '2px',
              color: '#0a0e1a',
            }}
          >
            <span className="absolute inset-x-0 top-0 h-px bg-white/40" />
            Got it — Start Practice →
          </button>
        </div>
      )}

      {/* Practice phase */}
      {phase === 'practice' && (
        <div className="p-4">
          <div className="text-xs tracking-widest uppercase mb-3" style={{ color: '#9b59f5' }}>
            Problem {current + 1} of {problems.length}
          </div>

          {/* Question */}
          <div
            className="font-bold text-white text-sm mb-4 p-4"
            style={{
              background: 'rgba(155,89,245,0.06)',
              border: '1px solid rgba(155,89,245,0.15)',
              borderRadius: '2px',
            }}
          >
            {problems[current]?.question}
          </div>

          {!feedback ? (
            <div className="space-y-3">
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={3}
                className="w-full px-4 py-3 text-sm text-white placeholder-white/30 outline-none resize-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '2px',
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={!answer.trim()}
                className="w-full py-3 font-black tracking-widest uppercase text-sm disabled:opacity-40 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, #9b59f5 0%, #7b3fd4 100%)',
                  border: 'none',
                  borderRadius: '2px',
                  color: 'white',
                }}
              >
                <span className="absolute inset-x-0 top-0 h-px bg-white/20" />
                Submit Answer
              </button>
            </div>
          ) : (
            <div>
              <div
                className="p-4 mb-4"
                style={{
                  background: feedback.correct ? 'rgba(46,204,113,0.08)' : 'rgba(255,71,87,0.08)',
                  border: `1px solid ${feedback.correct ? 'rgba(46,204,113,0.3)' : 'rgba(255,71,87,0.3)'}`,
                  borderRadius: '2px',
                }}
              >
                <div className="font-black tracking-widest uppercase text-sm mb-1" style={{ color: feedback.correct ? '#2ecc71' : '#ff4757' }}>
                  {feedback.correct ? '✅ Correct!' : '❌ Not quite'}
                </div>
                {feedback.coinsEarned > 0 && (
                  <div className="text-xs tracking-widest uppercase mb-2" style={{ color: '#f7c948' }}>
                    +{feedback.coinsEarned} coins 🪙
                  </div>
                )}
                <div className="text-sm leading-relaxed text-white/70 whitespace-pre-wrap">{feedback.explanation}</div>
              </div>
              <button
                onClick={handleNext}
                className="w-full py-3 font-black tracking-widest uppercase text-sm relative overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, #00d4ff 0%, #0095b3 100%)',
                  border: 'none',
                  borderRadius: '2px',
                  color: '#0a0e1a',
                }}
              >
                <span className="absolute inset-x-0 top-0 h-px bg-white/40" />
                {current + 1 >= problems.length ? 'Finish Mission →' : 'Next Problem →'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
