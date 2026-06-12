import { useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { avg, sum, fmtNum, getScoreColor } from '@/utils/format'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

export default function ManagerBehavior() {
  const user = useAuthStore(s => s.user)
  const { getManagerTrips } = useDataStore()
  const trips = useMemo(() => getManagerTrips(user?.id || ''), [user, getManagerTrips])

  const driverStats = useMemo(() => {
    const map: Record<string, typeof trips> = {}
    trips.forEach(t => { if (!map[t.driver_id]) map[t.driver_id] = []; map[t.driver_id].push(t) })
    return Object.entries(map).map(([id, ts]) => ({
      id,
      avgScore: avg(ts.map(t => t.driver_score)),
      harshBraking: sum(ts.map(t => t.harsh_braking_count)),
      suddenAccel: sum(ts.map(t => t.sudden_acceleration_count)),
      overspeed: sum(ts.map(t => t.overspeed_count)),
      avgSpeed: avg(ts.map(t => t.speed_kmph)),
      costPerKm: avg(ts.map(t => t.cost_per_km)),
    })).sort((a, b) => b.avgScore - a.avgScore)
  }, [trips])

  const kpis = useMemo(() => ({
    avgScore: avg(trips.map(t => t.driver_score)),
    highRisk: trips.filter(t => t.driver_score < 50).length,
    totalOverspeed: sum(trips.map(t => t.overspeed_count)),
    totalHarshBraking: sum(trips.map(t => t.harsh_braking_count)),
  }), [trips])

  const radarData = useMemo(() => {
    const top = driverStats.slice(0, 1)[0]
    if (!top) return []
    return [
      { metric: 'Eco Score', value: top.avgScore },
      { metric: 'Braking', value: Math.max(0, 100 - top.harshBraking * 5) },
      { metric: 'Acceleration', value: Math.max(0, 100 - top.suddenAccel * 5) },
      { metric: 'Speed', value: Math.max(0, 100 - top.overspeed * 10) },
      { metric: 'Smoothness', value: Math.min(100, top.avgScore + 10) },
      { metric: 'Efficiency', value: Math.max(0, 100 - top.costPerKm * 100) },
    ]
  }, [driverStats])

  return (
    <div className="page fade-up">
      <div className="topbar"><div className="topbar-title">🧠 Driver Behaviour Analytics</div></div>
      <div style={{ padding: '1.8rem' }}>
        <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
          {[
            { icon: '🧠', bg: 'rgba(0,212,170,.15)', val: fmtNum(kpis.avgScore), lbl: 'Fleet Avg Eco Score' },
            { icon: '⚠️', bg: 'rgba(239,68,68,.15)', val: String(kpis.highRisk), lbl: 'High Risk Trips' },
            { icon: '🚀', bg: 'rgba(245,158,11,.15)', val: String(kpis.totalOverspeed), lbl: 'Overspeed Events' },
            { icon: '🛑', bg: 'rgba(59,130,246,.15)', val: String(kpis.totalHarshBraking), lbl: 'Harsh Braking' },
          ].map(k => (
            <div key={k.lbl} className="kpi-card">
              <div className="kpi-icon" style={{ background: k.bg }}>{k.icon}</div>
              <div><div className="kpi-val">{k.val}</div><div className="kpi-lbl">{k.lbl}</div></div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          <div className="card">
            <div className="sec-head"><h3>🏆 Eco Score Leaderboard</h3></div>
            {driverStats.map((d, i) => {
              const medals = ['🥇', '🥈', '🥉']
              const scoreColor = getScoreColor(d.avgScore)
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.6rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '1.1rem', width: 24 }}>{medals[i] || `${i + 1}.`}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.82rem', color: 'var(--primary)', minWidth: 64 }}>{d.id}</span>
                  <div style={{ flex: 1 }}>
                    <div className="prog-track"><div className="prog-fill" style={{ width: `${d.avgScore}%`, background: scoreColor }} /></div>
                  </div>
                  <span style={{ color: scoreColor, fontWeight: 700, fontSize: '.85rem', minWidth: 36 }}>{fmtNum(d.avgScore)}</span>
                </div>
              )
            })}
          </div>

          <div className="card">
            <div className="sec-head"><h3>📡 Top Driver Radar</h3></div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,.1)" />
                <PolarAngleAxis dataKey="metric" stroke="#9BA3C7" fontSize={11} />
                <Radar dataKey="value" stroke="#00D4AA" fill="#00D4AA" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip contentStyle={{ background: '#2D3555', border: '1px solid #3A4268', borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="sec-head"><h3>📊 Detailed Behaviour Table</h3></div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Driver</th><th>Score</th><th>Harsh Braking</th><th>Sudden Accel</th><th>Overspeed</th><th>Avg Speed</th><th>Cost/km</th><th>Rating</th></tr></thead>
              <tbody>
                {driverStats.map(d => (
                  <tr key={d.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'var(--primary)' }}>{d.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 3, minWidth: 60 }}>
                          <div style={{ width: `${d.avgScore}%`, height: '100%', borderRadius: 3, background: getScoreColor(d.avgScore) }} />
                        </div>
                        <span style={{ fontSize: '.8rem', fontWeight: 700 }}>{fmtNum(d.avgScore)}</span>
                      </div>
                    </td>
                    <td style={{ color: d.harshBraking > 20 ? 'var(--danger)' : 'var(--success)' }}>{d.harshBraking}</td>
                    <td style={{ color: d.suddenAccel > 20 ? 'var(--danger)' : 'var(--success)' }}>{d.suddenAccel}</td>
                    <td style={{ color: d.overspeed > 10 ? 'var(--danger)' : 'var(--success)' }}>{d.overspeed}</td>
                    <td>{fmtNum(d.avgSpeed)} km/h</td>
                    <td>₹{fmtNum(d.costPerKm)}</td>
                    <td><span className={`badge ${d.avgScore >= 75 ? 'badge-success' : d.avgScore >= 50 ? 'badge-warning' : 'badge-danger'}`}>{d.avgScore >= 75 ? '⭐ Good' : d.avgScore >= 50 ? '⚠️ Average' : '❌ Poor'}</span></td>
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
