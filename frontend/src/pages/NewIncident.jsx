import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { AlertTriangle, MapPin, User, FileText, CheckCircle, ChevronDown } from 'lucide-react'
import L from 'leaflet'
import { incidentApi } from '../api/client'

const ACCRA = [5.6037, -0.187]

const INCIDENT_TYPES = [
  { value: 'medical', label: 'Medical Emergency', color: '#10b981', emoji: '🏥' },
  { value: 'fire', label: 'Fire', color: '#ef4444', emoji: '🔥' },
  { value: 'crime', label: 'Crime / Robbery', color: '#3b82f6', emoji: '🚔' },
  { value: 'accident', label: 'Road Accident', color: '#f59e0b', emoji: '🚗' },
  { value: 'other', label: 'Other', color: '#a78bfa', emoji: '❗' },
]

const incidentIcon = (color) =>
  L.divIcon({
    html: `<div style="
      width:24px;height:24px;border-radius:50%;
      background:${color};border:2px solid #fff;
      box-shadow:0 0 12px ${color}99;
    "></div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })

function LocationPicker({ onSelect, position }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng)
    },
  })

  return position ? (
    <Marker
      position={position}
      icon={incidentIcon('#ce1126')}
    />
  ) : null
}

export default function NewIncident() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    citizenName: '',
    citizenPhone: '',
    incidentType: '',
    notes: '',
  })
  const [position, setPosition] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!position) {
      setError('Please click on the map to select the incident location.')
      return
    }
    if (!form.incidentType) {
      setError('Please select an incident type.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await incidentApi.post('/incidents', {
        citizenName: form.citizenName,
        citizenPhone: form.citizenPhone || undefined,
        incidentType: form.incidentType,
        latitude: position.lat,
        longitude: position.lng,
        notes: form.notes || undefined,
      })
      setSuccess(res.data.incident || res.data)
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create incident.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedType = INCIDENT_TYPES.find((t) => t.value === form.incidentType)

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-fadeIn">
        <div
          className="max-w-md w-full mx-4 p-8 rounded-2xl text-center"
          style={{ background: 'var(--bg-card)', border: '1px solid rgba(34, 197, 94, 0.3)', boxShadow: '0 0 40px rgba(34, 197, 94, 0.1)' }}
        >
          <div
            className="flex items-center justify-center mx-auto mb-4"
            style={{
              width: 64, height: 64,
              background: 'rgba(34, 197, 94, 0.15)',
              border: '2px solid rgba(34, 197, 94, 0.4)',
              borderRadius: '50%',
            }}
          >
            <CheckCircle size={32} color="#22c55e" />
          </div>
          <h2
            style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1.5rem', color: '#dbeafe', marginBottom: 4 }}
          >
            Incident Logged
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 20 }}>
            Responder has been automatically dispatched
          </p>

          <div
            className="text-left p-4 rounded-lg mb-6"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            {[
              ['Incident ID', success.id?.slice(0, 8) + '...'],
              ['Type', form.incidentType],
              ['Status', success.status || 'dispatched'],
              ['Assigned Unit', success.assignedUnitId ? 'Dispatched' : 'Pending'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5" style={{ borderBottom: '1px solid rgba(26,58,107,0.3)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'Rajdhani', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</span>
                <span style={{ color: '#dbeafe', fontSize: '0.82rem', fontFamily: 'JetBrains Mono' }}>{v}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setSuccess(null); setForm({ citizenName: '', citizenPhone: '', incidentType: '', notes: '' }); setPosition(null) }}
              className="flex-1 py-2.5 rounded-lg"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontFamily: 'Rajdhani', fontWeight: 600, letterSpacing: '0.06em', cursor: 'pointer' }}
            >
              New Incident
            </button>
            <button
              onClick={() => navigate('/dispatch')}
              className="flex-1 py-2.5 rounded-lg"
              style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#93c5fd', fontFamily: 'Rajdhani', fontWeight: 600, letterSpacing: '0.06em', cursor: 'pointer' }}
            >
              View Dispatch
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div
            style={{ width: 36, height: 36, background: 'rgba(206, 17, 38, 0.12)', border: '1px solid rgba(206, 17, 38, 0.35)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <AlertTriangle size={18} color="#ce1126" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '1.3rem', color: '#dbeafe', lineHeight: 1 }}>
              Log New Incident
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 1 }}>
              Fill the form and click the map to set the incident location
            </p>
          </div>
        </div>
      </div>

      {/* Body: form + map */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — form */}
        <div
          className="flex flex-col overflow-y-auto w-96 flex-shrink-0"
          style={{ borderRight: '1px solid var(--border)', background: 'var(--bg-surface)' }}
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Citizen name */}
            <div>
              <label className="form-label">
                <User size={12} style={{ display: 'inline', marginRight: 5 }} />
                Caller Name *
              </label>
              <input
                className="cmd-input mt-1.5"
                placeholder="e.g. Kwame Asante"
                value={form.citizenName}
                onChange={set('citizenName')}
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="form-label">Phone Number</label>
              <input
                className="cmd-input mt-1.5"
                placeholder="e.g. 0244000000"
                value={form.citizenPhone}
                onChange={set('citizenPhone')}
              />
            </div>

            {/* Incident type */}
            <div>
              <label className="form-label">
                <AlertTriangle size={12} style={{ display: 'inline', marginRight: 5 }} />
                Incident Type *
              </label>
              <div className="mt-1.5 grid grid-cols-1 gap-2">
                {INCIDENT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, incidentType: t.value }))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all"
                    style={{
                      background: form.incidentType === t.value ? `${t.color}18` : 'rgba(12, 30, 53, 0.5)',
                      border: `1px solid ${form.incidentType === t.value ? `${t.color}55` : 'rgba(26, 58, 107, 0.4)'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>{t.emoji}</span>
                    <span
                      style={{
                        fontFamily: 'Rajdhani',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: form.incidentType === t.value ? t.color : 'var(--text-secondary)',
                        letterSpacing: '0.03em',
                      }}
                    >
                      {t.label}
                    </span>
                    {form.incidentType === t.value && (
                      <CheckCircle size={14} style={{ marginLeft: 'auto', color: t.color }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="form-label">
                <MapPin size={12} style={{ display: 'inline', marginRight: 5 }} />
                Incident Location *
              </label>
              <div
                className="mt-1.5 px-3 py-2.5 rounded-lg"
                style={{
                  background: position ? 'rgba(34, 197, 94, 0.08)' : 'rgba(12, 30, 53, 0.5)',
                  border: `1px solid ${position ? 'rgba(34, 197, 94, 0.35)' : 'rgba(26, 58, 107, 0.4)'}`,
                }}
              >
                {position ? (
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.78rem' }}>
                    <div style={{ color: '#86efac' }}>✓ Location selected</div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
                      {position.lat.toFixed(5)}°N, {position.lng.toFixed(5)}°E
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>
                    Click on the map to pin the incident location
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="form-label">
                <FileText size={12} style={{ display: 'inline', marginRight: 5 }} />
                Incident Notes
              </label>
              <textarea
                className="cmd-input mt-1.5"
                rows={4}
                placeholder="Describe what the caller reported..."
                value={form.notes}
                onChange={set('notes')}
                style={{ resize: 'vertical', minHeight: 90 }}
              />
            </div>

            {error && (
              <div
                className="flex items-start gap-2 p-3 rounded-lg"
                style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
              >
                <AlertTriangle size={14} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ color: '#fca5a5', fontSize: '0.82rem' }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg"
              style={{
                background: submitting ? 'rgba(206, 17, 38, 0.3)' : 'linear-gradient(135deg, #ce1126 0%, #a00d1f 100%)',
                color: '#fff',
                border: '1px solid rgba(206, 17, 38, 0.5)',
                fontFamily: 'Rajdhani',
                fontWeight: 700,
                fontSize: '0.9rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: submitting ? 'none' : '0 4px 16px rgba(206, 17, 38, 0.25)',
              }}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                  Dispatching...
                </span>
              ) : (
                'Submit & Dispatch'
              )}
            </button>
          </form>
        </div>

        {/* Right — map */}
        <div className="flex-1 relative">
          {/* Map instruction overlay */}
          {!position && (
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full"
              style={{
                background: 'rgba(7, 20, 34, 0.9)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                color: '#93c5fd',
                fontFamily: 'Rajdhani',
                fontWeight: 600,
                fontSize: '0.78rem',
                letterSpacing: '0.06em',
                pointerEvents: 'none',
              }}
            >
              <MapPin size={12} style={{ display: 'inline', marginRight: 5 }} />
              CLICK MAP TO SET INCIDENT LOCATION
            </div>
          )}
          {position && (
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full"
              style={{
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                color: '#86efac',
                fontFamily: 'Rajdhani',
                fontWeight: 600,
                fontSize: '0.78rem',
                letterSpacing: '0.06em',
                pointerEvents: 'none',
              }}
            >
              ✓ LOCATION PINNED — CLICK TO REPOSITION
            </div>
          )}

          <MapContainer
            center={ACCRA}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <LocationPicker onSelect={setPosition} position={position} />
          </MapContainer>
        </div>
      </div>

      <style>{`
        .form-label {
          display: block;
          font-family: 'Rajdhani', sans-serif;
          font-weight: 600;
          font-size: 0.72rem;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
          text-transform: uppercase;
        }
      `}</style>
    </div>
  )
}
