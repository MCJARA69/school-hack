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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1f35 50%, #0a0e1a 100%)' }}>
      {/* Glow effect */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.06) 0%, transparent 70%)' }} />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl font-black tracking-widest uppercase mb-1" style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            background: 'linear-gradient(180deg, #ffffff 0%, #00d4ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            GRIND MODE
          </div>
          <div className="text-xs tracking-widest text-fn-blue uppercase opacity-70">
            Study Planner
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="SCHOOLOGY USERNAME"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full px-4 py-3 text-sm tracking-widest text-white placeholder-white/30 outline-none uppercase"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: '2px',
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
            required
          />
          <input
            type="password"
            placeholder="PASSWORD"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 text-sm tracking-widest text-white placeholder-white/30 outline-none uppercase"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: '2px',
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
            required
          />

          {error && (
            <p className="text-fn-red text-sm tracking-wide uppercase">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-black tracking-widest uppercase text-sm disabled:opacity-50 relative overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #00d4ff 0%, #0095b3 100%)',
              border: 'none',
              borderRadius: '2px',
              color: '#0a0e1a',
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
          >
            <span className="absolute inset-x-0 top-0 h-px bg-white/40" />
            {loading ? 'DEPLOYING...' : 'DEPLOY →'}
          </button>
        </form>
      </div>
    </div>
  )
}
