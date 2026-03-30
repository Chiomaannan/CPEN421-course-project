import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const ROLES = ['system_admin', 'hospital_admin', 'police_admin', 'fire_admin', 'ambulance_driver']

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('dispatcher')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(name, email, password, role)
      }
      navigate('/dispatch', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#02060f' }}
    >
      {/* Dot grid background */}
      <div
        className="absolute inset-0 dot-grid"
        style={{ opacity: 0.6 }}
      />

      {/* Radar circles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border"
            style={{
              width: i * 200,
              height: i * 200,
              borderColor: 'rgba(26, 58, 107, 0.2)',
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
        {/* Animated radar sweep */}
        <div
          className="absolute rounded-full"
          style={{
            width: 600,
            height: 600,
            border: '1px solid rgba(59, 130, 246, 0.15)',
            animation: 'radar 4s linear infinite',
          }}
        />
      </div>

      {/* Corner coordinates — decorative */}
      <div
        className="absolute top-6 left-6"
        style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: 'rgba(58, 90, 122, 0.7)' }}
      >
        N 05°33′ E 000°11′
      </div>
      <div
        className="absolute top-6 right-6"
        style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: 'rgba(58, 90, 122, 0.7)' }}
      >
        ACCRA COMMAND · GHA
      </div>
      <div
        className="absolute bottom-6 left-6"
        style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: 'rgba(58, 90, 122, 0.7)' }}
      >
        CPEN 421 · UGCS · 2026
      </div>
      <div
        className="absolute bottom-6 right-6"
        style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: 'rgba(58, 90, 122, 0.7)' }}
      >
        SEC-LEVEL: AUTHORIZED
      </div>

      {/* Login card */}
      <div
        className="relative z-10 w-full max-w-md mx-4 animate-slideUp"
        style={{
          background: 'rgba(7, 20, 34, 0.92)',
          border: '1px solid rgba(26, 58, 107, 0.6)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(59, 130, 246, 0.05)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Ghana stripe top */}
        <div className="ghana-stripe rounded-t-[15px]" />

        <div className="px-8 pt-8 pb-10">
          {/* Logo area */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="flex items-center justify-center mb-4"
              style={{
                width: 64,
                height: 64,
                background: 'rgba(206, 17, 38, 0.12)',
                border: '2px solid rgba(206, 17, 38, 0.35)',
                borderRadius: '14px',
                position: 'relative',
              }}
            >
              <Shield size={32} color="#ce1126" />
              {/* Glow */}
              <div
                className="absolute inset-0 rounded-[14px]"
                style={{ boxShadow: '0 0 30px rgba(206, 17, 38, 0.2)', pointerEvents: 'none' }}
              />
            </div>

            <h1
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700,
                fontSize: '2rem',
                color: '#dbeafe',
                letterSpacing: '0.08em',
                lineHeight: 1,
                marginBottom: 4,
              }}
            >
              GERCS
            </h1>
            <p
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 500,
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            >
              Ghana Emergency Response<br />Command System
            </p>
          </div>

          {/* Divider */}
          <div
            className="mb-6"
            style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(26,58,107,0.8), transparent)' }}
          />

          {/* Mode tabs */}
          <div
            className="flex mb-6 rounded-lg overflow-hidden"
            style={{ border: '1px solid rgba(26,58,107,0.5)', background: 'rgba(4,11,24,0.6)' }}
          >
            {['login', 'register'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError('') }}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s',
                  background: mode === m ? 'rgba(206,17,38,0.15)' : 'transparent',
                  color: mode === m ? '#fca5a5' : 'var(--text-muted)',
                  borderBottom: mode === m ? '2px solid #ce1126' : '2px solid transparent',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  className="cmd-input"
                  placeholder="Kwame Mensah"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  letterSpacing: '0.1em',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                Operator Email
              </label>
              <input
                type="email"
                className="cmd-input"
                placeholder="admin@emergency.gov.gh"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  letterSpacing: '0.1em',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                Access Code
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="cmd-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Role
                </label>
                <select
                  className="cmd-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  style={{ cursor: 'pointer' }}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r} style={{ background: '#040b18' }}>
                      {r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <div
                className="flex items-center gap-2 p-3 rounded-lg"
                style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
              >
                <AlertCircle size={14} color="#f87171" style={{ flexShrink: 0 }} />
                <span style={{ color: '#fca5a5', fontSize: '0.82rem' }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-display font-700 transition-all duration-200"
              style={{
                background: loading
                  ? 'rgba(206, 17, 38, 0.3)'
                  : 'linear-gradient(135deg, #ce1126 0%, #a00d1f 100%)',
                color: '#fff',
                border: '1px solid rgba(206, 17, 38, 0.5)',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 700,
                fontSize: '0.95rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(206, 17, 38, 0.3)',
                marginTop: 8,
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.boxShadow = '0 6px 28px rgba(206, 17, 38, 0.5)'
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.boxShadow = '0 4px 20px rgba(206, 17, 38, 0.3)'
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                  {mode === 'login' ? 'Authenticating...' : 'Registering...'}
                </span>
              ) : (
                mode === 'login' ? 'Authenticate' : 'Create Account'
              )}
            </button>
          </form>

          <p
            className="text-center mt-5"
            style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'Rajdhani', letterSpacing: '0.05em' }}
          >
            Authorized personnel only · All access is logged and monitored
          </p>
        </div>

        {/* Ghana stripe bottom */}
        <div className="ghana-stripe rounded-b-[15px]" />
      </div>
    </div>
  )
}
