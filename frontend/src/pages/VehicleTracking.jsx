import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { io } from 'socket.io-client'
import { MapPin, Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react'
import { dispatchApi } from '../api/client'

const ACCRA = [5.6037, -0.187]

const VEHICLE_CONFIG = {
  ambulance:  { color: '#10b981', label: 'Ambulance',  emoji: '🚑' },
  police_car: { color: '#3b82f6', label: 'Police Car', emoji: '🚔' },
  fire_truck: { color: '#ef4444', label: 'Fire Truck', emoji: '🚒' },
}

const STATUS_COLORS = {
  idle:        '#64748b',
  responding:  '#f59e0b',
  on_scene:    '#ef4444',
  returning:   '#3b82f6',
  maintenance: '#374151',
}

function makeVehicleIcon(type, status) {
  const cfg = VEHICLE_CONFIG[type] || { color: '#94a3b8', emoji: '🚗' }
  const statusColor = STATUS_COLORS[status] || '#64748b'
  return L.divIcon({
    html: `
      <div style="
        position:relative;
        width:38px;height:38px;
        display:flex;align-items:center;justify-content:center;
      ">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:${cfg.color}22;
          border:2px solid ${cfg.color};
          box-shadow:0 0 14px ${cfg.color}66;
        "></div>
        <div style="
          position:absolute;bottom:-3px;right:-3px;
          width:12px;height:12px;border-radius:50%;
          background:${statusColor};border:2px solid #030d1a;
        "></div>
        <span style="font-size:1.1rem;position:relative;z-index:1;">${cfg.emoji}</span>
      </div>
    `,
    className: '',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  })
}

function formatStatus(s) {
  return s?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Unknown'
}

export default function VehicleTracking() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [connected, setConnected] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const socketRef = useRef(null)
  const mapRef = useRef(null)

  // Fetch initial vehicle list
  const fetchVehicles = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await dispatchApi.get('/vehicles')
      const data = res.data?.vehicles || []
      setVehicles(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load vehicles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVehicles()
  }, [fetchVehicles])

  // Socket.io for real-time updates
  useEffect(() => {
    const token = localStorage.getItem('gercs_token')
    if (!token) return

    const socket = io('http://localhost:3004', {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    socket.on('connect_error', (err) => {
      console.warn('Socket connect error:', err.message)
      setConnected(false)
    })

    socket.on('location_update', (data) => {
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === data.vehicleId
            ? { ...v, latitude: data.latitude, longitude: data.longitude, status: data.status, lastUpdated: data.timestamp }
            : v,
        ),
      )
    })

    socket.on('vehicle_status_update', (data) => {
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === data.vehicleId ? { ...v, status: data.status } : v,
        ),
      )
    })

    socket.on('vehicle_dispatched', (data) => {
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === data.vehicleId ? { ...v, ...data } : v,
        ),
      )
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const flyToVehicle = (v) => {
    setSelectedVehicle(v.id)
    if (mapRef.current && v.latitude && v.longitude) {
      mapRef.current.flyTo([v.latitude, v.longitude], 15, { duration: 1.2 })
    }
  }

  const locatedVehicles = vehicles.filter((v) => v.latitude && v.longitude)
  const activeVehicles = vehicles.filter((v) => v.status === 'responding' || v.status === 'on_scene')

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <div
        className="w-72 flex-shrink-0 flex flex-col overflow-hidden"
        style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}
      >
        {/* Panel header */}
        <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MapPin size={16} color="#3b82f6" />
              <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1rem', color: '#dbeafe', letterSpacing: '0.04em' }}>
                Vehicle Tracking
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded"
              style={{
                background: connected ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${connected ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
              }}
            >
              {connected
                ? <Wifi size={11} color="#22c55e" />
                : <WifiOff size={11} color="#f87171" />}
              <span style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.08em', color: connected ? '#86efac' : '#fca5a5' }}>
                {connected ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-2 mt-2">
            {[
              { label: 'Total', value: vehicles.length, color: '#7ea8ce' },
              { label: 'Active', value: activeVehicles.length, color: '#f59e0b' },
              { label: 'On Map', value: locatedVehicles.length, color: '#22c55e' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="flex-1 text-center py-2 rounded-lg"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1.2rem', color }}>{value}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontFamily: 'Rajdhani', letterSpacing: '0.06em' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading && (
            <div className="flex items-center justify-center h-20 gap-2">
              <span className="spinner" />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading...</span>
            </div>
          )}

          {error && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg"
              style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)' }}
            >
              <AlertTriangle size={13} color="#f87171" />
              <span style={{ color: '#fca5a5', fontSize: '0.78rem' }}>{error}</span>
            </div>
          )}

          {!loading && vehicles.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <MapPin size={28} style={{ color: 'rgba(58, 90, 122, 0.3)' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                No vehicles registered
              </p>
            </div>
          )}

          {vehicles.map((v) => {
            const cfg = VEHICLE_CONFIG[v.vehicleType] || { color: '#94a3b8', label: v.vehicleType, emoji: '🚗' }
            const statusColor = STATUS_COLORS[v.status] || '#64748b'
            const isSelected = selectedVehicle === v.id

            return (
              <button
                key={v.id}
                onClick={() => flyToVehicle(v)}
                className="w-full text-left p-3 rounded-lg transition-all"
                style={{
                  background: isSelected ? `${cfg.color}12` : 'rgba(12, 30, 53, 0.5)',
                  border: `1px solid ${isSelected ? `${cfg.color}44` : 'rgba(26, 58, 107, 0.35)'}`,
                  cursor: 'pointer',
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span style={{ fontSize: '1rem' }}>{cfg.emoji}</span>
                  <span style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '0.875rem', color: isSelected ? cfg.color : '#dbeafe', flex: 1 }}>
                    {v.vehicleNumber || `VEH-${v.id?.slice(0, 6)}`}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-xs"
                    style={{
                      background: `${statusColor}22`,
                      border: `1px solid ${statusColor}44`,
                      color: statusColor,
                      fontFamily: 'Rajdhani',
                      fontWeight: 600,
                      fontSize: '0.65rem',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {formatStatus(v.status)}
                  </span>
                </div>

                <div style={{ fontFamily: 'Rajdhani', fontSize: '0.7rem', color: cfg.color, letterSpacing: '0.04em' }}>
                  {cfg.label}
                </div>

                {v.latitude && v.longitude && (
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 3 }}>
                    {v.latitude.toFixed(4)}°, {v.longitude.toFixed(4)}°
                  </div>
                )}

                {v.incidentId && (
                  <div style={{ fontSize: '0.7rem', color: '#fcd34d', marginTop: 3, fontFamily: 'Rajdhani', letterSpacing: '0.04em' }}>
                    ⚡ Incident: {v.incidentId.slice(0, 8)}...
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Refresh button */}
        <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={fetchVehicles}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg transition-all"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontFamily: 'Rajdhani',
              fontWeight: 600,
              fontSize: '0.78rem',
              letterSpacing: '0.08em',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} />
            Reload Vehicles
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {/* Legend overlay */}
        <div
          className="absolute bottom-6 right-4 z-10 p-3 rounded-xl"
          style={{
            background: 'rgba(7, 20, 34, 0.92)',
            border: '1px solid rgba(26, 58, 107, 0.6)',
            backdropFilter: 'blur(10px)',
            minWidth: 150,
          }}
        >
          <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>
            VEHICLE TYPES
          </div>
          {Object.entries(VEHICLE_CONFIG).map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-2 mb-1.5">
              <span style={{ fontSize: '0.9rem' }}>{cfg.emoji}</span>
              <span style={{ color: cfg.color, fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '0.78rem' }}>{cfg.label}</span>
            </div>
          ))}
          <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
          <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 6 }}>
            STATUS
          </div>
          {Object.entries(STATUS_COLORS).map(([s, c]) => (
            <div key={s} className="flex items-center gap-2 mb-1">
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', fontFamily: 'Rajdhani' }}>
                {formatStatus(s)}
              </span>
            </div>
          ))}
        </div>

        <MapContainer
          center={ACCRA}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {locatedVehicles.map((v) => (
            <Marker
              key={v.id}
              position={[v.latitude, v.longitude]}
              icon={makeVehicleIcon(v.vehicleType, v.status)}
              eventHandlers={{ click: () => setSelectedVehicle(v.id) }}
            >
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1rem', color: '#dbeafe', marginBottom: 6 }}>
                    {VEHICLE_CONFIG[v.vehicleType]?.emoji} {v.vehicleNumber || 'Vehicle'}
                  </div>
                  {[
                    ['Type', VEHICLE_CONFIG[v.vehicleType]?.label || v.vehicleType],
                    ['Status', formatStatus(v.status)],
                    ['Lat', v.latitude?.toFixed(5)],
                    ['Lng', v.longitude?.toFixed(5)],
                    v.incidentId ? ['Incident', v.incidentId.slice(0, 8) + '...'] : null,
                  ]
                    .filter(Boolean)
                    .map(([k, val]) => (
                      <div key={k} className="flex justify-between" style={{ marginBottom: 3 }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'Rajdhani', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {k}
                        </span>
                        <span style={{ color: '#dbeafe', fontSize: '0.78rem', fontFamily: 'JetBrains Mono' }}>
                          {val}
                        </span>
                      </div>
                    ))}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
