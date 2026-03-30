import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { BarChart3, Clock, AlertTriangle, CheckCircle, Activity, RefreshCw } from 'lucide-react'
import { analyticsApi } from '../api/client'

// ─── Color palettes ──────────────────────────────────────────────────────────
const TYPE_COLORS = {
  medical:  '#10b981',
  fire:     '#ef4444',
  crime:    '#3b82f6',
  accident: '#f59e0b',
  other:    '#a78bfa',
}

const REGION_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a78bfa', '#06b6d4']

const UNIT_COLORS = {
  ambulance:     '#10b981',
  police_station: '#3b82f6',
  fire_station:  '#ef4444',
}

// ─── Reusable components ──────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, loading }) {
  return (
    <div
      className="rounded-xl p-5 flex items-start gap-4"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div
        style={{
          width: 44, height: 44,
          background: `${color}18`,
          border: `1px solid ${color}44`,
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ color: 'var(--text-muted)', fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
          {label}
        </div>
        {loading ? (
          <div style={{ width: 60, height: 28, background: 'var(--bg-elevated)', borderRadius: 6, animation: 'pulse 2s infinite' }} />
        ) : (
          <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1.8rem', color: '#dbeafe', lineHeight: 1 }}>
            {value ?? '—'}
          </div>
        )}
        {sub && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 3 }}>{sub}</div>
        )}
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, children, loading }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1rem', color: '#dbeafe', marginBottom: 2 }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{subtitle}</p>
        )}
      </div>
      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-2">
            <span className="spinner" />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading chart...</span>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0c1e35', border: '1px solid rgba(26,58,107,0.6)', borderRadius: 8, padding: '8px 12px' }}>
      <p style={{ color: '#dbeafe', fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color || '#93c5fd', fontSize: '0.8rem', margin: '2px 0' }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</strong>
        </p>
      ))}
    </div>
  )
}

function CustomPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, name, value }) {
  if (value === 0) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#dbeafe" textAnchor="middle" dominantBaseline="central"
      style={{ fontFamily: 'Rajdhani', fontSize: '12px', fontWeight: 600 }}>
      {value}
    </text>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Analytics() {
  const [dashboard, setDashboard] = useState(null)
  const [responseTimes, setResponseTimes] = useState(null)
  const [byRegion, setByRegion] = useState(null)
  const [utilization, setUtilization] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)

  const fetchAll = async () => {
    setLoading(true)
    setError('')
    try {
      const [dashRes, rtRes, regionRes, utilRes] = await Promise.all([
        analyticsApi.get('/analytics/dashboard'),
        analyticsApi.get('/analytics/response-times'),
        analyticsApi.get('/analytics/incidents-by-region'),
        analyticsApi.get('/analytics/resource-utilization'),
      ])
      setDashboard(dashRes.data)
      setResponseTimes(rtRes.data)
      setByRegion(regionRes.data)
      setUtilization(utilRes.data)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  // ── Transform data for charts ────────────────────────────────────────────
  const responseTimeChartData = responseTimes?.byType?.map((item) => ({
    name: item.incidentType?.charAt(0).toUpperCase() + item.incidentType?.slice(1) || 'Unknown',
    'Avg (min)': parseFloat(item.avgResponseTime || 0).toFixed(1),
    Count: parseInt(item.count || 0),
    color: TYPE_COLORS[item.incidentType] || '#94a3b8',
  })) || []

  const incidentTypeChartData = byRegion?.byType?.map((item) => ({
    name: item.incidentType?.charAt(0).toUpperCase() + item.incidentType?.slice(1) || 'Unknown',
    value: parseInt(item.count || 0),
    color: TYPE_COLORS[item.incidentType] || '#94a3b8',
  })) || []

  // Build region chart: aggregate per region
  const regionMap = {}
  byRegion?.byRegion?.forEach((item) => {
    if (!regionMap[item.region]) regionMap[item.region] = { region: item.region }
    regionMap[item.region][item.incidentType] = (regionMap[item.region][item.incidentType] || 0) + parseInt(item.count || 0)
  })
  const regionChartData = Object.values(regionMap)

  const dispatchData = utilization?.dispatchesByUnitType?.map((item, i) => ({
    name: item.assignedUnitType?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Unknown',
    Dispatches: parseInt(item.totalDispatches || 0),
    color: UNIT_COLORS[item.assignedUnitType] || REGION_COLORS[i % REGION_COLORS.length],
  })) || []

  const statusData = byRegion?.byStatus?.map((item) => ({
    name: item.status?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Unknown',
    value: parseInt(item.count || 0),
  })) || []

  const STATUS_PIE_COLORS = { Created: '#ef4444', Dispatched: '#3b82f6', 'In Progress': '#f59e0b', Resolved: '#22c55e' }

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Page header */}
      <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              style={{ width: 36, height: 36, background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.35)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <BarChart3 size={18} color="#a78bfa" />
            </div>
            <div>
              <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1.3rem', color: '#dbeafe', lineHeight: 1 }}>
                Analytics & Insights
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 1 }}>
                {lastRefresh ? `Last updated ${lastRefresh.toLocaleTimeString('en-GH', { hour12: false })}` : 'Loading...'}
              </p>
            </div>
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontFamily: 'Rajdhani',
              fontWeight: 600,
              fontSize: '0.78rem',
              letterSpacing: '0.06em',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div
            className="flex items-center gap-3 p-4 rounded-lg"
            style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)' }}
          >
            <AlertTriangle size={16} color="#f87171" />
            <span style={{ color: '#fca5a5', fontSize: '0.875rem' }}>{error}</span>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            icon={Activity}
            label="Total Incidents"
            value={dashboard?.totalIncidents}
            color="#3b82f6"
            loading={loading}
          />
          <StatCard
            icon={CheckCircle}
            label="Resolved"
            value={dashboard?.resolvedIncidents}
            sub={dashboard ? `${Math.round((dashboard.resolvedIncidents / Math.max(dashboard.totalIncidents, 1)) * 100)}% resolution rate` : null}
            color="#22c55e"
            loading={loading}
          />
          <StatCard
            icon={AlertTriangle}
            label="Active Incidents"
            value={dashboard?.activeIncidents}
            color="#f59e0b"
            loading={loading}
          />
          <StatCard
            icon={Clock}
            label="Avg Response"
            value={dashboard?.avgResponseTimeMinutes > 0 ? `${dashboard.avgResponseTimeMinutes}m` : '—'}
            sub="minutes to first response"
            color="#a78bfa"
            loading={loading}
          />
        </div>

        {/* Row 2: Response times + Incident types */}
        <div className="grid grid-cols-2 gap-4">
          <ChartCard
            title="Response Times by Incident Type"
            subtitle="Average minutes from incident creation to dispatch"
            loading={loading}
          >
            {responseTimeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={responseTimeChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: '#7ea8ce', fontSize: 11, fontFamily: 'Rajdhani' }} />
                  <YAxis tick={{ fill: '#7ea8ce', fontSize: 11, fontFamily: 'Rajdhani' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Avg (min)" radius={[4, 4, 0, 0]}>
                    {responseTimeChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No resolved incidents with response time data yet" />
            )}
          </ChartCard>

          <ChartCard
            title="Incidents by Type"
            subtitle="Distribution of all recorded incidents"
            loading={loading}
          >
            {incidentTypeChartData.filter((d) => d.value > 0).length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={incidentTypeChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={40}
                    dataKey="value"
                    nameKey="name"
                    labelLine={false}
                    label={<CustomPieLabel />}
                  >
                    {incidentTypeChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: '#7ea8ce', fontFamily: 'Rajdhani', fontSize: '0.8rem' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No incident data available yet" />
            )}
          </ChartCard>
        </div>

        {/* Row 3: By region + Dispatch by unit + Status */}
        <div className="grid grid-cols-3 gap-4">
          <ChartCard
            title="Incidents by Region"
            subtitle="Incident volume across Ghana's regions"
            loading={loading}
          >
            {regionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={regionChartData} margin={{ top: 5, right: 5, left: -15, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" tick={{ fill: '#7ea8ce', fontSize: 9, fontFamily: 'Rajdhani' }} angle={-20} textAnchor="end" interval={0} />
                  <YAxis tick={{ fill: '#7ea8ce', fontSize: 10, fontFamily: 'Rajdhani' }} />
                  <Tooltip content={<CustomTooltip />} />
                  {['medical', 'fire', 'crime', 'accident', 'other'].map((type) => (
                    <Bar key={type} dataKey={type} stackId="a" fill={TYPE_COLORS[type]} radius={type === 'other' ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No regional data yet" />
            )}
          </ChartCard>

          <ChartCard
            title="Dispatches by Unit Type"
            subtitle="Which services are deployed most"
            loading={loading}
          >
            {dispatchData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dispatchData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: '#7ea8ce', fontSize: 10, fontFamily: 'Rajdhani' }} />
                  <YAxis tick={{ fill: '#7ea8ce', fontSize: 10, fontFamily: 'Rajdhani' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Dispatches" radius={[4, 4, 0, 0]}>
                    {dispatchData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No dispatch data yet" />
            )}
          </ChartCard>

          <ChartCard
            title="Incident Status Breakdown"
            subtitle="Current status of all incidents"
            loading={loading}
          >
            {statusData.filter((d) => d.value > 0).length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    dataKey="value"
                    nameKey="name"
                    labelLine={false}
                    label={<CustomPieLabel />}
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_PIE_COLORS[entry.name] || REGION_COLORS[i % REGION_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: '#7ea8ce', fontFamily: 'Rajdhani', fontSize: '0.78rem' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No status data yet" />
            )}
          </ChartCard>
        </div>

        {/* Resource counts */}
        {utilization?.resourceCounts && (
          <div
            className="rounded-xl p-5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <h3 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1rem', color: '#dbeafe', marginBottom: 16 }}>
              Registered Resources
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Hospitals', value: utilization.resourceCounts.hospitals, color: '#10b981', emoji: '🏥' },
                { label: 'Police Stations', value: utilization.resourceCounts.policeStations, color: '#3b82f6', emoji: '🚔' },
                { label: 'Fire Stations', value: utilization.resourceCounts.fireStations, color: '#ef4444', emoji: '🚒' },
              ].map(({ label, value, color, emoji }) => (
                <div
                  key={label}
                  className="flex items-center gap-4 p-4 rounded-xl"
                  style={{ background: `${color}0a`, border: `1px solid ${color}28` }}
                >
                  <span style={{ fontSize: '2rem' }}>{emoji}</span>
                  <div>
                    <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '2rem', color, lineHeight: 1 }}>
                      {value || 0}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'Rajdhani', letterSpacing: '0.05em' }}>
                      {label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyChart({ message }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 gap-2">
      <BarChart3 size={28} style={{ color: 'rgba(58, 90, 122, 0.3)' }} />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>{message}</p>
    </div>
  )
}
