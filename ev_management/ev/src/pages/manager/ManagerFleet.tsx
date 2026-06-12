import { useMemo, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { fmtNum, getBattColor } from '@/utils/format'

export default function ManagerFleet() {
  const user = useAuthStore(s => s.user)
  const { getManagerTrips } = useDataStore()
  const trips = useMemo(() => getManagerTrips(user?.id || ''), [user, getManagerTrips])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const vehicles = useMemo(() => {
    const seen = new Set<string>()
    return trips.filter(t => {
      if (seen.has(t.vehicle_id)) return false
      seen.add(t.vehicle_id); return true
    }).filter(t => {
      const q = search.toLowerCase()
      const matchSearch = !q || t.vehicle_id.toLowerCase().includes(q) || t.vehicle_make.toLowerCase().includes(q) || t.vehicle_model.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'All' || t.vehicle_status === statusFilter
      return matchSearch && matchStatus
    })
  }, [trips, search, statusFilter])

  const statuses = ['All', 'Active', 'Under Maintenance', 'Inactive']

  return (
    <div className="page fade-up">
      <div className="topbar">
        <div className="topbar-title">🚗 Fleet Overview</div>
      </div>
      <div style={{ padding: '1.8rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input className="input" style={{ maxWidth: 280 }} placeholder="Search vehicle, make, model..." value={search} onChange={e => setSearch(e.target.value)} />
          <div style={{ display: 'flex', gap: '.5rem' }}>
            {statuses.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {vehicles.map((t, i) => {
            const battColor = getBattColor(t.battery_percentage)
            const statusColor = t.vehicle_status === 'Active' ? '#22C55E' : t.vehicle_status === 'Under Maintenance' ? '#EF4444' : '#F59E0B'
            return (
              <div key={i} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${battColor}, transparent)` }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.8rem' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'var(--primary)', marginBottom: '.2rem' }}>{t.vehicle_id}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.95rem' }}>{t.vehicle_make} {t.vehicle_model}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{t.car_type} · {t.manufacture_year}</div>
                  </div>
                  <span className="badge" style={{ background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44` }}>
                    {t.vehicle_status}
                  </span>
                </div>

                <div style={{ marginBottom: '.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: '.3rem' }}>
                    <span style={{ color: 'var(--muted)' }}>Battery</span>
                    <span style={{ color: battColor, fontWeight: 700 }}>{t.battery_percentage}%</span>
                  </div>
                  <div className="prog-track">
                    <div className={`prog-fill ${t.battery_percentage > 50 ? 'prog-green' : t.battery_percentage > 25 ? 'prog-amber' : 'prog-red'}`}
                      style={{ width: `${t.battery_percentage}%` }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', fontSize: '.78rem' }}>
                  {[
                    ['Reg', t.registration_number],
                    ['Battery kWh', t.battery_capacity_kwh + ' kWh'],
                    ['Driver', t.driver_id],
                    ['Charging', t.charging_status],
                  ].map(([l, v]) => (
                    <div key={l} style={{ background: 'rgba(255,255,255,.03)', borderRadius: 6, padding: '.4rem .6rem' }}>
                      <div style={{ color: 'var(--muted)', fontSize: '.68rem' }}>{l}</div>
                      <div style={{ fontWeight: 600, fontFamily: l === 'Reg' || l === 'Driver' ? 'var(--font-mono)' : 'inherit', fontSize: '.78rem' }}>{v}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '.8rem', display: 'flex', gap: '.4rem' }}>
                  <span className={`badge ${t.battery_health_percent > 90 ? 'badge-success' : t.battery_health_percent > 75 ? 'badge-warning' : 'badge-danger'}`}>
                    Health {t.battery_health_percent}%
                  </span>
                  {t.battery_alert_flag && <span className="badge badge-danger">⚠️ Alert</span>}
                  {t.tire_health_percent < 60 && <span className="badge badge-warning">🔧 Tires</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
