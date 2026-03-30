import { useState, useEffect, useCallback } from 'react'
import { Radio, RefreshCw, AlertTriangle, Clock, MapPin, Truck } from 'lucide-react'
import { incidentApi } from '../api/client'

const TYPE_META = {
  medical:  { label: 'Medical',  color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', icon: '🏥' },
  fire:     { label: 'Fire',     color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)',  icon: '🔥' },
  crime:    { label: 'Crime',    color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', icon: '🚔' },
  accident: { label: 'Accident', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', icon: '🚗' },
  other:    { label: 'Other',    color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.12)',icon: '❗' },
}

const STATUS_META = {
  created:     { label: 'Created',     class: 'status-created',     dot: 'pulse-dot-red' },
  dispatched:  { label: 'Dispatched',  class: 'status-dispatched',  dot: 'pulse-dot-blue' },
  in_progress: { label: 'In Progress', class: 'status-in_progress', dot: 'pulse-dot-amber' },
  resolved:    { label: 'Resolved',    class: 'status-resolved',    dot: 'pulse-dot-green' },
}

const UNIT_TYPES = {
  ambulance:     '🚑 Ambulance',
  police_station:'🚔 Police',
  fire_station:  '🚒 Fire Unit',
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.created
  return (
    <span className={`status-badge ${meta.class}`}>
      <span className={`pulse-dot ${meta.dot}`} />
      {meta.label}
    </span>
  )
}

function TypeBadge({ type }) {
  const meta = TYPE_META[type] || TYPE_META.other
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span>{meta.icon}</span>
      <span style={{ color: meta.color, fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '0.82rem' }}>
        {meta.label}
      </span>
    </span>
  )
}

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`
  return new Date(dateStr).toLocaleDateString('en-GH')
}

export default function DispatchStatus() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchIncidents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError('')
    try {
      const res = await incidentApi.get('/incidents/open')
      // API may return { incidents } or an array
      const data = res.data?.incidents || res.data || []
      setIncidents(Array.isArray(data) ? data : [])
      setLastRefresh(new Date())
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load incidents')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchIncidents()
    const interval = setInterval(() => fetchIncidents(true), 15000)
    return () => clearInterval(interval)
  }, [fetchIncidents])

  const statusCounts = {
    created:     incidents.filter((i) => i.status === 'created').length,
    dispatched:  incidents.filter((i) => i.status === 'dispatched').length,
    in_progress: incidents.filter((i) => i.status === 'in_progress').length,
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              style={{ width: 36, height: 36, background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.35)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Radio size={18} color="#3b82f6" />
            </div>
            <div>
              <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1.3rem', color: '#dbeafe', lineHeight: 1 }}>
                Dispatch Status
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 1 }}>
                {lastRefresh
                  ? `Last updated ${lastRefresh.toLocaleTimeString('en-GH', { hour12: false })} · Auto-refreshes every 15s`
                  : 'Loading...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="live-badge">
              <span className="dot" />
              LIVE
            </div>
            <button
              onClick={() => fetchIncidents(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontFamily: 'Rajdhani',
                fontWeight: 600,
                fontSize: '0.78rem',
                letterSpacing: '0.06em',
                cursor: refreshing ? 'not-allowed' : 'pointer',
              }}
            >
              <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary strip */}
        <div className="flex gap-4 mt-4">
          {[
            { label: 'Awaiting Dispatch', value: statusCounts.created, color: '#ef4444', dot: 'pulse-dot-red' },
            { label: 'Dispatched', value: statusCounts.dispatched, color: '#3b82f6', dot: 'pulse-dot-blue' },
            { label: 'In Progress', value: statusCounts.in_progress, color: '#f59e0b', dot: 'pulse-dot-amber' },
            { label: 'Total Open', value: incidents.length, color: '#7ea8ce', dot: null },
          ].map(({ label, value, color, dot }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              {dot && <span className={`pulse-dot ${dot}`} />}
              <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1.25rem', color }}>{value}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'Rajdhani', letterSpacing: '0.05em' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading && (
          <div className="flex items-center justify-center h-40 gap-3">
            <span className="spinner" />
            <span style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani', fontSize: '0.9rem' }}>
              Loading active incidents...
            </span>
          </div>
        )}

        {error && !loading && (
          <div
            className="flex items-center gap-3 p-4 rounded-lg"
            style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)' }}
          >
            <AlertTriangle size={16} color="#f87171" />
            <span style={{ color: '#fca5a5', fontSize: '0.875rem' }}>{error}</span>
          </div>
        )}

        {!loading && !error && incidents.length === 0 && (
          <div className="flex flex-col items-center justify-center h-60 gap-3">
            <Radio size={40} style={{ color: 'rgba(58, 90, 122, 0.4)' }} />
            <p style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '1rem', letterSpacing: '0.06em' }}>
              NO ACTIVE INCIDENTS
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>All clear — no open incidents at this time</p>
          </div>
        )}

        {!loading && incidents.length > 0 && (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--border)' }}
          >
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Caller</th>
                  <th>
                    <MapPin size={11} style={{ display: 'inline', marginRight: 4 }} />
                    Location
                  </th>
                  <th>
                    <Truck size={11} style={{ display: 'inline', marginRight: 4 }} />
                    Assigned Unit
                  </th>
                  <th>
                    <Clock size={11} style={{ display: 'inline', marginRight: 4 }} />
                    Logged
                  </th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc.id} className="animate-fadeIn">
                    <td>
                      <TypeBadge type={inc.incidentType} />
                    </td>
                    <td>
                      <StatusBadge status={inc.status} />
                    </td>
                    <td>
                      <div style={{ color: '#dbeafe', fontWeight: 500 }}>
                        {inc.citizenName || '—'}
                      </div>
                      {inc.citizenPhone && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 1 }}>
                          {inc.citizenPhone}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {inc.latitude?.toFixed(4)}°, {inc.longitude?.toFixed(4)}°
                      </div>
                      {inc.address && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>
                          {inc.address}
                        </div>
                      )}
                    </td>
                    <td>
                      {inc.assignedUnitType ? (
                        <span style={{ color: '#93c5fd', fontSize: '0.82rem', fontFamily: 'Rajdhani', fontWeight: 600 }}>
                          {UNIT_TYPES[inc.assignedUnitType] || inc.assignedUnitType}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pending...</span>
                      )}
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {timeAgo(inc.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
