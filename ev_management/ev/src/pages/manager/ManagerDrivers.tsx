import { useMemo, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { avg, fmtNum, getScoreColor } from '@/utils/format'

export default function ManagerDrivers() {
  const user = useAuthStore(s => s.user)
  const { getManagerTrips, getManagerDrivers } = useDataStore()
  const trips = useMemo(() => getManagerTrips(user?.id || ''), [user, getManagerTrips])
  const drivers = useMemo(() => getManagerDrivers(user?.id || ''), [user, getManagerDrivers])
  const [selected, setSelected] = useState<string | null>(null)

  const driverStats = useMemo(() => {
    const map: Record<string, { trips: typeof trips }> = {}
    trips.forEach(t => {
      if (!map[t.driver_id]) map[t.driver_id] = { trips: [] }
      map[t.driver_id].trips.push(t)
    })
    return Object.entries(map).map(([id, d]) => ({
      id,
      driver: drivers.find(dr => dr.driver_id === id),
      avgScore: avg(d.trips.map(t => t.driver_score)),
      totalDist: d.trips.reduce((a, t) => a + t.distance_travelled_km, 0),
      avgBatt: avg(d.trips.map(t => t.battery_percentage)),
      harshBraking: d.trips.reduce((a, t) => a + t.harsh_braking_count, 0),
      overspeed: d.trips.reduce((a, t) => a + t.overspeed_count, 0),
      trips: d.trips,
    })).sort((a, b) => b.avgScore - a.avgScore)
  }, [trips, drivers])

  const sel = selected ? driverStats.find(d => d.id === selected) : null

  return (
    <div className="page fade-up">
      <div className="topbar"><div className="topbar-title">👥 My Drivers</div></div>
      <div style={{ padding: '1.8rem' }}>
        <div className="grid-2">
          {/* Driver list */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {driverStats.map(d => {
                const scoreColor = getScoreColor(d.avgScore)
                const r = 22; const circ = 2 * Math.PI * r
                const stroke = circ * (1 - d.avgScore / 100)
                return (
                  <div key={d.id} className="card" onClick={() => setSelected(d.id)}
                    style={{ cursor: 'pointer', border: selected === d.id ? '1px solid var(--primary)' : '1px solid var(--border)', transition: 'all .2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="avatar" style={{ background: `${scoreColor}33`, color: scoreColor, border: `1px solid ${scoreColor}55` }}>
                        {d.id.replace('DR', '')}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{d.driver?.driver_name || d.id}</div>
                        <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{d.driver?.vehicle_model} · {d.driver?.fleet_manager_id}</div>
                        <div style={{ display: 'flex', gap: '.5rem', marginTop: '.3rem' }}>
                          <span className={`badge ${d.avgScore >= 75 ? 'badge-success' : d.avgScore >= 50 ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '.68rem' }}>
                            Score {fmtNum(d.avgScore)}
                          </span>
                          <span className="badge badge-info" style={{ fontSize: '.68rem' }}>{fmtNum(d.totalDist)} km</span>
                        </div>
                      </div>
                      <svg width="56" height="56" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="5"/>
                        <circle cx="28" cy="28" r={r} fill="none" stroke={scoreColor} strokeWidth="5"
                          strokeDasharray={circ} strokeDashoffset={stroke} strokeLinecap="round"
                          style={{ transform: 'rotate(-90deg)', transformOrigin: '28px 28px' }}/>
                        <text x="28" y="33" textAnchor="middle" fill={scoreColor} fontSize="11" fontWeight="800">{Math.round(d.avgScore)}</text>
                      </svg>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Driver detail */}
          <div>
            {sel ? (
              <div className="card">
                <div style={{ marginBottom: '1.2rem' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>{sel.driver?.driver_name || sel.id}</div>
                  <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{sel.id} · {sel.driver?.fleet_manager_id}</div>
                </div>
                {[
                  ['Vehicle', sel.driver?.vehicle_id],
                  ['Make/Model', `${sel.driver?.vehicle_make} ${sel.driver?.vehicle_model}`],
                  ['Experience', sel.driver?.driver_experience_years + ' years'],
                  ['Total Distance', fmtNum(sel.totalDist) + ' km'],
                  ['Avg Battery', fmtNum(sel.avgBatt) + '%'],
                  ['Harsh Braking', String(sel.harshBraking)],
                  ['Overspeed Events', String(sel.overspeed)],
                  ['Avg Eco Score', fmtNum(sel.avgScore)],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '.55rem 0', borderBottom: '1px solid var(--border)', fontSize: '.85rem' }}>
                    <span style={{ color: 'var(--muted)' }}>{l}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}

                <div style={{ marginTop: '1.2rem' }}>
                  <div style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: '.75rem' }}>Last 5 Trips</div>
                  {sel.trips.slice(0, 5).map((t, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem .6rem', background: 'rgba(255,255,255,.03)', borderRadius: 6, marginBottom: '.3rem', fontSize: '.78rem' }}>
                      <span>{t.start_location} → {t.destination}</span>
                      <span style={{ color: getScoreColor(t.driver_score), fontWeight: 600 }}>{fmtNum(t.distance_travelled_km)} km</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--muted)' }}>
                ← Select a driver to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
