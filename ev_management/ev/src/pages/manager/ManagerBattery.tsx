import { useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { avg, fmtNum } from '@/utils/format'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function ManagerBattery() {
  const user = useAuthStore(s => s.user)
  const { getManagerTrips } = useDataStore()
  const trips = useMemo(() => getManagerTrips(user?.id || ''), [user, getManagerTrips])

  const vehicles = useMemo(() => {
    const seen = new Set<string>()
    return trips.filter(t => { if (seen.has(t.vehicle_id)) return false; seen.add(t.vehicle_id); return true })
      .sort((a, b) => a.battery_percentage - b.battery_percentage)
  }, [trips])

  const kpis = useMemo(() => ({
    avgBatt: avg(trips.map(t => t.battery_percentage)),
    critical: vehicles.filter(v => v.battery_percentage < 20).length,
    warning: vehicles.filter(v => v.battery_percentage >= 20 && v.battery_percentage < 50).length,
    healthy: vehicles.filter(v => v.battery_percentage >= 50).length,
  }), [trips, vehicles])

  const chartData = useMemo(() =>
    vehicles.slice(0, 12).map(v => ({ id: v.vehicle_id, soc: v.battery_percentage, health: v.battery_health_percent }))
  , [vehicles])

  return (
    <div className="page fade-up">
      <div className="topbar"><div className="topbar-title">🔋 Battery Health</div></div>
      <div style={{ padding: '1.8rem' }}>
        <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
          {[
            { icon: '🔋', bg: 'rgba(0,212,170,.15)', val: fmtNum(kpis.avgBatt) + '%', lbl: 'Avg Fleet Battery' },
            { icon: '🔴', bg: 'rgba(239,68,68,.15)',  val: String(kpis.critical), lbl: 'Critical (<20%)' },
            { icon: '🟡', bg: 'rgba(245,158,11,.15)', val: String(kpis.warning),  lbl: 'Warning (20–50%)' },
            { icon: '🟢', bg: 'rgba(34,197,94,.15)',  val: String(kpis.healthy),  lbl: 'Healthy (>50%)' },
          ].map(k => (
            <div key={k.lbl} className="kpi-card">
              <div className="kpi-icon" style={{ background: k.bg }}>{k.icon}</div>
              <div><div className="kpi-val">{k.val}</div><div className="kpi-lbl">{k.lbl}</div></div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="sec-head"><h3>Battery SOC vs Health by Vehicle</h3></div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
              <XAxis dataKey="id" stroke="#9BA3C7" fontSize={10} />
              <YAxis stroke="#9BA3C7" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#2D3555', border: '1px solid #3A4268', borderRadius: 8 }} />
              <Bar dataKey="soc" fill="#00D4AA" name="Battery %" radius={[4, 4, 0, 0]} />
              <Bar dataKey="health" fill="#3B82F6" name="Health %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="sec-head"><h3>All Vehicles — Battery Status</h3></div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Vehicle</th><th>Driver</th><th>Battery %</th><th>Health %</th><th>Temp °C</th><th>Cycles</th><th>Charging</th><th>Alert</th></tr></thead>
              <tbody>
                {vehicles.map((t, i) => (
                  <tr key={i} style={{ background: t.battery_percentage < 20 ? 'rgba(239,68,68,.05)' : t.battery_percentage < 50 ? 'rgba(245,158,11,.04)' : '' }}>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'var(--primary)' }}>{t.vehicle_id}</span></td>
                    <td style={{ fontSize: '.8rem' }}>{t.driver_id}</td>
                    <td>
                      <div style={{ minWidth: 100 }}>
                        <div style={{ fontSize: '.75rem', marginBottom: 2, color: t.battery_percentage < 20 ? 'var(--danger)' : t.battery_percentage < 50 ? 'var(--warning)' : 'var(--success)' }}>{t.battery_percentage}%</div>
                        <div className="prog-track"><div className={`prog-fill ${t.battery_percentage > 50 ? 'prog-green' : t.battery_percentage > 25 ? 'prog-amber' : 'prog-red'}`} style={{ width: `${t.battery_percentage}%` }} /></div>
                      </div>
                    </td>
                    <td>
                      <div style={{ minWidth: 100 }}>
                        <div style={{ fontSize: '.75rem', marginBottom: 2 }}>{t.battery_health_percent}%</div>
                        <div className="prog-track"><div className={`prog-fill ${t.battery_health_percent > 90 ? 'prog-green' : t.battery_health_percent > 75 ? 'prog-amber' : 'prog-red'}`} style={{ width: `${t.battery_health_percent}%` }} /></div>
                      </div>
                    </td>
                    <td>{fmtNum(t.battery_temperature)}°C</td>
                    <td>{t.charging_cycles}</td>
                    <td>
                      <span className={`badge ${t.charging_status === 'Fully Charged' ? 'badge-success' : t.charging_status === 'Charging' ? 'badge-info' : 'badge-warning'}`}>{t.charging_status}</span>
                    </td>
                    <td>{t.battery_alert_flag ? <span className="badge badge-danger">⚠️</span> : <span className="badge badge-success">OK</span>}</td>
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
