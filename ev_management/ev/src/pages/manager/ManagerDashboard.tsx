import { useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { avg, sum, fmtRs, fmtNum, getBattColor, getScoreColor } from '@/utils/format'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function KpiCard({ icon, bg, val, lbl }: { icon: string; bg: string; val: string; lbl: string }) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={{ background: bg }}>{icon}</div>
      <div><div className="kpi-val">{val}</div><div className="kpi-lbl">{lbl}</div></div>
    </div>
  )
}

export default function ManagerDashboard() {
  const user = useAuthStore(s => s.user)
  const { getManagerTrips } = useDataStore()
  const trips = useMemo(() => getManagerTrips(user?.id || ''), [user, getManagerTrips])

  const kpis = useMemo(() => {
    const vids = [...new Set(trips.map(t => t.vehicle_id))]
    const active = trips.filter(t => t.vehicle_status === 'Active').length
    const charging = trips.filter(t => t.charging_status === 'Charging' || t.charging_status === 'Fully Charged').length
    const maint = trips.filter(t => t.vehicle_status === 'Under Maintenance').length
    const avgBatt = avg(trips.map(t => t.battery_percentage))
    const totalCost = sum(trips.map(t => t.daily_energy_cost))
    return { vehicles: vids.length, active, charging, maint, avgBatt, totalCost }
  }, [trips])

  // Recent trips
  const recentTrips = useMemo(() => trips.slice(0, 15), [trips])

  // Alerts
  const alerts = useMemo(() =>
    trips.filter(t => t.battery_alert_flag || t.battery_percentage < 25 || t.battery_health_percent < 85 || t.last_service_days > 200).slice(0, 8),
    [trips])

  // Weekly energy chart
  const weeklyData = useMemo(() => {
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
    return days.map((d, i) => ({
      day: d,
      energy: avg(trips.filter((_, idx) => idx % 7 === i).map(t => t.energy_consumed_kwh)) || 0,
      cost: avg(trips.filter((_, idx) => idx % 7 === i).map(t => t.daily_energy_cost)) || 0,
    }))
  }, [trips])

  // Driver performance
  const driverPerf = useMemo(() => {
    const map: Record<string, { name: string; score: number[]; dist: number[]; batt: number[] }> = {}
    trips.forEach(t => {
      if (!map[t.driver_id]) map[t.driver_id] = { name: t.driver_id, score: [], dist: [], batt: [] }
      map[t.driver_id].score.push(t.driver_score)
      map[t.driver_id].dist.push(t.distance_travelled_km)
      map[t.driver_id].batt.push(t.battery_percentage)
    })
    return Object.entries(map).slice(0, 10).map(([id, d]) => ({
      id,
      avgScore: avg(d.score),
      totalDist: sum(d.dist),
      avgBatt: avg(d.batt),
    })).sort((a, b) => b.avgScore - a.avgScore)
  }, [trips])

  if (!trips.length) return <div className="page"><p style={{ color: 'var(--muted)' }}>Loading dashboard data...</p></div>

  return (
    <div className="page fade-up">
      <div className="topbar">
        <div className="topbar-title">📊 Dashboard Overview</div>
        <div className="topbar-right">
          <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{user?.name} · {trips.length} trips</span>
        </div>
      </div>

      <div style={{ padding: '1.8rem' }}>
        {/* KPIs */}
        <div className="kpi-grid">
          <KpiCard icon="🚗" bg="rgba(0,212,170,.15)"  val={String(kpis.vehicles)} lbl="Total Vehicles" />
          <KpiCard icon="✅" bg="rgba(34,197,94,.15)"  val={String(kpis.active)}   lbl="Active" />
          <KpiCard icon="🔌" bg="rgba(59,130,246,.15)" val={String(kpis.charging)} lbl="Charging" />
          <KpiCard icon="🔧" bg="rgba(239,68,68,.15)"  val={String(kpis.maint)}    lbl="In Maintenance" />
          <KpiCard icon="🔋" bg="rgba(245,158,11,.15)" val={fmtNum(kpis.avgBatt) + '%'} lbl="Avg Battery" />
          <KpiCard icon="💰" bg="rgba(0,212,170,.15)"  val={fmtRs(kpis.totalCost)} lbl="Total Daily Cost" />
        </div>

        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          {/* Alerts */}
          <div className="card">
            <div className="sec-head"><h3>🔔 Active Alerts</h3><span className="badge badge-danger">{alerts.length}</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', maxHeight: 300, overflowY: 'auto' }}>
              {alerts.map((t, i) => {
                let color = '#F59E0B', icon = '⚠️', title = '', sub = ''
                if (t.battery_percentage < 20) { color = '#EF4444'; icon = '🔴'; title = `Critical Battery — ${t.vehicle_id}`; sub = `${t.battery_percentage}% remaining` }
                else if (t.battery_health_percent < 85) { color = '#F59E0B'; icon = '🔋'; title = `Battery Health Low — ${t.vehicle_id}`; sub = `Health: ${t.battery_health_percent}%` }
                else if (t.last_service_days > 200) { icon = '⚙️'; title = `Service Overdue — ${t.vehicle_id}`; sub = `${t.last_service_days} days` }
                else { title = `Battery Alert — ${t.vehicle_id}`; sub = `${t.battery_percentage}%` }
                return (
                  <div key={i} style={{ display: 'flex', gap: '.7rem', padding: '.65rem', background: 'rgba(255,255,255,.03)', borderRadius: 8, borderLeft: `3px solid ${color}` }}>
                    <span>{icon}</span>
                    <div><div style={{ fontSize: '.84rem', fontWeight: 600 }}>{title}</div><div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{sub}</div></div>
                  </div>
                )
              })}
              {!alerts.length && <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>✅ No active alerts</p>}
            </div>
          </div>

          {/* Weekly energy */}
          <div className="card">
            <div className="sec-head"><h3>⚡ Weekly Energy Usage</h3></div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00D4AA" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
                <XAxis dataKey="day" stroke="#9BA3C7" fontSize={11} />
                <YAxis stroke="#9BA3C7" fontSize={11} />
                <Tooltip contentStyle={{ background: '#2D3555', border: '1px solid #3A4268', borderRadius: 8 }} />
                <Area type="monotone" dataKey="energy" stroke="#00D4AA" strokeWidth={2} fill="url(#eg)" name="kWh" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Driver performance table */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="sec-head"><h3>👥 Driver Performance</h3></div>
          <div className="tbl-wrap">
            <table>
              <thead><tr>
                <th>Driver ID</th><th>Avg Score</th><th>Total Distance</th>
                <th>Avg Battery</th><th>Rating</th>
              </tr></thead>
              <tbody>
                {driverPerf.map(d => (
                  <tr key={d.id}>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '.82rem', color: 'var(--primary)' }}>{d.id}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 3 }}>
                          <div style={{ width: `${d.avgScore}%`, height: '100%', borderRadius: 3, background: getScoreColor(d.avgScore) }} />
                        </div>
                        <span style={{ fontSize: '.8rem', fontWeight: 700 }}>{fmtNum(d.avgScore)}</span>
                      </div>
                    </td>
                    <td>{fmtNum(d.totalDist)} km</td>
                    <td>
                      <span style={{ color: getBattColor(d.avgBatt), fontWeight: 600 }}>{fmtNum(d.avgBatt)}%</span>
                    </td>
                    <td>
                      <span className={`badge ${d.avgScore >= 75 ? 'badge-success' : d.avgScore >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                        {d.avgScore >= 75 ? '⭐ Good' : d.avgScore >= 50 ? '⚠️ Average' : '❌ Poor'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent trips */}
        <div className="card">
          <div className="sec-head"><h3>🗺️ Recent Trips</h3><span className="badge badge-primary">{trips.length} total</span></div>
          <div className="tbl-wrap">
            <table>
              <thead><tr>
                <th>Driver</th><th>Vehicle</th><th>Route</th><th>Distance</th>
                <th>Battery</th><th>Energy</th><th>Cost</th><th>Weather</th>
              </tr></thead>
              <tbody>
                {recentTrips.map((t, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'var(--primary)' }}>{t.driver_id}</td>
                    <td>{t.vehicle_id}</td>
                    <td style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{t.start_location} → {t.destination}</td>
                    <td>{fmtNum(t.distance_travelled_km)} km</td>
                    <td>
                      <div style={{ minWidth: 90 }}>
                        <div style={{ fontSize: '.75rem', marginBottom: 2 }}>{t.battery_percentage}%</div>
                        <div className="prog-track"><div className={`prog-fill ${t.battery_percentage > 50 ? 'prog-green' : t.battery_percentage > 25 ? 'prog-amber' : 'prog-red'}`} style={{ width: `${t.battery_percentage}%` }} /></div>
                      </div>
                    </td>
                    <td>{fmtNum(t.energy_consumed_kwh)} kWh</td>
                    <td>{fmtRs(t.total_trip_cost)}</td>
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
