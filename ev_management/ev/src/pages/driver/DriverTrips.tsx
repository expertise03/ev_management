import { useMemo, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { fmtRs, fmtNum, sum, avg } from '@/utils/format'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function DriverTrips() {
  const user = useAuthStore(s => s.user)
  const { getDriverTrips } = useDataStore()
  const trips = useMemo(() => getDriverTrips(user?.id || ''), [user, getDriverTrips])
  const [search, setSearch] = useState('')

  const filtered = useMemo(() =>
    trips.filter(t => !search || t.start_location.toLowerCase().includes(search.toLowerCase()) || t.destination.toLowerCase().includes(search.toLowerCase()))
  , [trips, search])

  const monthlyData = useMemo(() => {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
    return months.map(m => {
      const mt = trips.filter(t => t.month === m)
      return { month: m.slice(0, 3), dist: sum(mt.map(t => t.distance_travelled_km)), cost: sum(mt.map(t => t.total_trip_cost)) }
    }).filter(d => d.dist > 0)
  }, [trips])

  const kpis = useMemo(() => ({
    totalDist: sum(trips.map(t => t.distance_travelled_km)),
    totalCost: sum(trips.map(t => t.total_trip_cost)),
    totalTrips: trips.length,
    avgEnergy: avg(trips.map(t => t.energy_consumed_kwh)),
  }), [trips])

  return (
    <div className="page fade-up">
      <div className="topbar"><div className="topbar-title">🗺️ My Trips</div></div>
      <div style={{ padding: '1.8rem' }}>
        <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
          {[
            { icon: '🗺️', bg: 'rgba(0,212,170,.15)', val: String(kpis.totalTrips), lbl: 'Total Trips' },
            { icon: '📍', bg: 'rgba(59,130,246,.15)', val: fmtNum(kpis.totalDist) + ' km', lbl: 'Total Distance' },
            { icon: '💰', bg: 'rgba(245,158,11,.15)', val: fmtRs(kpis.totalCost), lbl: 'Total Cost' },
            { icon: '⚡', bg: 'rgba(34,197,94,.15)',  val: fmtNum(kpis.avgEnergy) + ' kWh', lbl: 'Avg Energy/Trip' },
          ].map(k => (
            <div key={k.lbl} className="kpi-card">
              <div className="kpi-icon" style={{ background: k.bg }}>{k.icon}</div>
              <div><div className="kpi-val">{k.val}</div><div className="kpi-lbl">{k.lbl}</div></div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="sec-head"><h3>📆 Monthly Distance & Cost</h3></div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
              <XAxis dataKey="month" stroke="#9BA3C7" fontSize={11} />
              <YAxis stroke="#9BA3C7" fontSize={11} />
              <Tooltip contentStyle={{ background: '#2D3555', border: '1px solid #3A4268', borderRadius: 8 }} />
              <Bar dataKey="dist" fill="#00D4AA" name="Distance (km)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <input className="input" style={{ maxWidth: 300 }} placeholder="Search trips by location..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="card">
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Date</th><th>From</th><th>To</th><th>Distance</th><th>Energy</th><th>Cost</th><th>Battery</th><th>Weather</th></tr></thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{t.timestamp?.toString().slice(0, 10)}</td>
                    <td>{t.start_location}</td>
                    <td>{t.destination}</td>
                    <td>{fmtNum(t.distance_travelled_km)} km</td>
                    <td>{fmtNum(t.energy_consumed_kwh)} kWh</td>
                    <td>{fmtRs(t.total_trip_cost)}</td>
                    <td><span style={{ color: t.battery_percentage > 50 ? 'var(--success)' : t.battery_percentage > 25 ? 'var(--warning)' : 'var(--danger)', fontWeight: 600 }}>{t.battery_percentage}%</span></td>
                    <td><span className="badge badge-info">{t.weather_condition}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
