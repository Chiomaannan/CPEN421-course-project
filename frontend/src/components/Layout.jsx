import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Radio,
  PlusCircle,
  MapPin,
  BarChart3,
  LogOut,
  Shield,
  ChevronRight,
  AlertTriangle,
  Activity,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const ALL_ROLES = ['system_admin', 'hospital_admin', 'police_admin', 'fire_admin', 'ambulance_driver']

const NAV_ITEMS = [
  {
    to: '/dispatch',
    label: 'Dispatch Status',
    icon: Radio,
    roles: ['system_admin', 'police_admin', 'fire_admin', 'hospital_admin'],
  },
  {
    to: '/incidents/new',
    label: 'New Incident',
    icon: PlusCircle,
    roles: ['system_admin'],
  },
  {
    to: '/tracking',
    label: 'Live Tracking',
    icon: MapPin,
    roles: ALL_ROLES,
  },
  {
    to: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
    roles: ['system_admin', 'hospital_admin'],
  },
]

const ROLE_LABELS = {
  system_admin: 'System Admin',
  hospital_admin: 'Hospital Admin',
  police_admin: 'Police Admin',
  fire_admin: 'Fire Admin',
  ambulance_driver: 'Driver',
}

const ROLE_COLORS = {
  system_admin: '#ce1126',
  hospital_admin: '#22c55e',
  police_admin: '#3b82f6',
  fire_admin: '#f97316',
  ambulance_driver: '#a78bfa',
}

function RoleChip({ role }) {
  const color = ROLE_COLORS[role] || '#7ea8ce'
  return (
    <span
      style={{
        background: `${color}22`,
        border: `1px solid ${color}55`,
        color: color,
        fontSize: '0.65rem',
        fontFamily: 'Rajdhani, sans-serif',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '2px 8px',
        borderRadius: '4px',
      }}
    >
      {ROLE_LABELS[role] || role}
    </span>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(user?.role))

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col flex-shrink-0 w-60"
        style={{
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{
                width: 38,
                height: 38,
                background: 'rgba(206, 17, 38, 0.15)',
                border: '1px solid rgba(206, 17, 38, 0.4)',
              }}
            >
              <Shield size={20} color="#ce1126" />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 700,
                  fontSize: '1.2rem',
                  color: '#dbeafe',
                  letterSpacing: '0.05em',
                  lineHeight: 1,
                }}
              >
                GERCS
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                EMERGENCY COMMAND
              </div>
            </div>
          </div>
          {/* Ghana stripe */}
          <div className="ghana-stripe mt-3 rounded-full" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive ? 'sidebar-active' : 'sidebar-inactive'
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                border: isActive
                  ? '1px solid rgba(59, 130, 246, 0.3)'
                  : '1px solid transparent',
                color: isActive ? '#93c5fd' : 'var(--text-secondary)',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={17}
                    style={{ color: isActive ? '#60a5fa' : 'var(--text-muted)', flexShrink: 0 }}
                  />
                  <span
                    style={{
                      fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      letterSpacing: '0.03em',
                      flex: 1,
                    }}
                  >
                    {label}
                  </span>
                  {isActive && (
                    <ChevronRight size={14} style={{ color: '#60a5fa', flexShrink: 0 }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* System status */}
        <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Activity size={13} style={{ color: '#22c55e' }} />
            <span style={{ fontSize: '0.7rem', color: '#22c55e', fontFamily: 'Rajdhani', fontWeight: 600, letterSpacing: '0.08em' }}>
              SYSTEMS ONLINE
            </span>
          </div>

          {/* User info */}
          <div
            className="rounded-lg p-3"
            style={{ background: 'rgba(12, 30, 53, 0.8)', border: '1px solid var(--border)' }}
          >
            <div
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: '#dbeafe',
                marginBottom: 4,
              }}
            >
              {user?.name || 'Unknown User'}
            </div>
            <div style={{ marginBottom: 8 }}>
              <RoleChip role={user?.role} />
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full transition-colors"
              style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fca5a5')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <LogOut size={13} />
              <span style={{ fontFamily: 'Rajdhani', fontWeight: 600, letterSpacing: '0.05em' }}>
                SIGN OUT
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-6 py-3 flex-shrink-0"
          style={{
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border)',
            minHeight: 56,
          }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} style={{ color: 'var(--ghana-red)' }} />
            <span
              style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 600,
                fontSize: '0.7rem',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}
            >
              Republic of Ghana — National Emergency Response Platform
            </span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <LiveClock />
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto" style={{ background: 'var(--bg-deep)' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function LiveClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span>
      {time.toLocaleDateString('en-GH', { dateStyle: 'medium' })} &nbsp;
      {time.toLocaleTimeString('en-GH', { hour12: false })} GMT
    </span>
  )
}

