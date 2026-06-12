import { useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { avg, fmtNum, getScoreColor } from '@/utils/format'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function DriverPerformance() {
  const user = useAuthStore(s => s.user)
  const { getDriverTrips } = useDataStore()
  const trips = useMemo(() => getDriverTrips(user?.id || ''), [user, getDriverTrips])

  const stats = useMemo(() => ({
    avgScore: avg(trips.map(t => t.driver_score)),
    harshBraking: trips.reduce((a, t) => a + t.harsh_braking_count, 0),
    suddenAccel: trips.reduce((a, t) => a + t.sudden_acceleration_count, 0),
    overspeed: trips.reduce((a, t) => a + t.overspeed_count, 0),
  }), [trips])

  const scoreColor = getScoreColor(stats.avgScore)
  const r = 52; const circ = 2 * Math.PI * r
  const strokeOffset = circ * (1 - stats.avgScore / 100)

  const trendData = useMemo(() =>
    trips.slice(0, 20).reverse().map((t, i) => ({ trip: i + 1, score: t.driver_score, speed: t.speed_kmph }))
  , [trips])

  const tips = useMemo(() => {
    const t: { icon: string; tip: string }[] = []
    const avg_harsh = stats.harshBraking / Math.max(trips.length, 1)
    const avg_over = stats.overspeed / Math.max(trips.length, 1)
    if (avg_harsh > 3) t.push({ icon: '🛑', tip: 'Maintain longer following distance to reduce harsh braking events and improve your eco score.' })
    if (stats.suddenAccel > 10) t.push({ icon: '🚀', tip: 'Accelerate smoothly — sudden bursts drain the battery faster and lower your score.' })
    if (avg_over > 2) t.push({ icon: '⚡', tip: 'Staying within speed limits improves range by up to 25% and keeps your score high.' })
    if (stats.avgScore >= 80) t.push({ icon: '🌟', tip: 'Excellent eco driving! Keep this standard to maximize battery range.' })
    if (!t.length) t.push({ icon: '👍', tip: 'Your driving behaviour is within acceptable parameters. Keep it up!' })
    return t
  }, [stats, trips])

  if (!trips.length) return <div className="page"><div style={{ padding: '1.8rem', color: 'var(--muted)' }}>No performance data found.</div></div>

  return (
    <div className="page fade-up">
      <div className="topbar"><div className="topbar-title">🧠 My Performance</div></div>
      <div style={{ padding: '1.8rem' }}>
        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          {/* Score ring */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.75rem', padding: '2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', alignSelf: 'flex-start' }}>🏆 Eco Score</h3>
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="12"/>
              <circle cx="80" cy="80" r={r} fill="none" stroke={scoreColor} strokeWidth="12"
                strokeDasharray={circ} strokeDashoffset={strokeOffset} strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '80px 80px', transition: 'stroke-dashoffset 1.2s ease' }}/>
              <text x="80" y="86" textAnchor="middle" fill={scoreColor} fontSize="28" fontWeight="800" fontFamily="Space Grotesk">{Math.round(stats.avgScore)}</text>
              <text x="80" y="102" textAnchor="middle" fill="#9BA3C7" fontSize="12">/ 100</text>
            </svg>
            <span className={`badge ${stats.avgScore >= 75 ? 'badge-success' : stats.avgScore >= 50 ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '.9rem', padding: '.3rem 1rem' }}>
              {stats.avgScore >= 75 ? '⭐ Excellent' : stats.avgScore >= 50 ? '⚠️ Average' : '❌ Needs Improvement'}
            </span>
            <div style={{ width: '100%' }}>
              {[
                ['Harsh Braking Events', stats.harshBraking, 50],
                ['Sudden Acceleration', stats.suddenAccel, 50],
                ['Overspeed Events', stats.overspeed, 20],
              ].map(([l, v, max]) => (
                <div key={String(l)} style={{ marginBottom: '.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: '.3rem' }}>
                    <span style={{ color: 'var(--muted)' }}>{l}</span>
                    <span style={{ color: Number(v) > Number(max) / 2 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{v}</span>
                  </div>
                  <div className="prog-track"><div className={`prog-fill ${Number(v) < Number(max) / 3 ? 'prog-green' : Number(v) < Number(max) * 2 / 3 ? 'prog-amber' : 'prog-red'}`} style={{ width: `${Math.min((Number(v) / Number(max)) * 100, 100)}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* Improvement tips */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.2rem' }}>💡 Improvement Tips</h3>
            {tips.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: '.8rem', padding: '.85rem', background: 'rgba(255,255,255,.03)', borderRadius: 10, marginBottom: '.6rem' }}>
                <span style={{ fontSize: '1.3rem' }}>{t.icon}</span>
                <p style={{ fontSize: '.86rem', color: 'var(--muted)', lineHeight: 1.6 }}>{t.tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Score trend */}
        <div className="card">
          <div className="sec-head"><h3>📈 Score Trend (Last 20 Trips)</h3></div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
              <XAxis dataKey="trip" stroke="#9BA3C7" fontSize={11} label={{ value: 'Trip', position: 'bottom', fill: '#9BA3C7', fontSize: 11 }} />
              <YAxis stroke="#9BA3C7" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#2D3555', border: '1px solid #3A4268', borderRadius: 8 }} />
              <Line type="monotone" dataKey="score" stroke="#00D4AA" strokeWidth={2.5} dot={{ fill: '#00D4AA', r: 4 }} name="Eco Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Behaviour table */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="sec-head"><h3>📊 Trip Behaviour History</h3></div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>#</th><th>Route</th><th>Score</th><th>Harsh Braking</th><th>Sudden Accel</th><th>Overspeed</th><th>Speed</th></tr></thead>
              <tbody>
                {trips.slice(0, 20).map((t, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--muted)', fontSize: '.75rem' }}>{i + 1}</td>
                    <td style={{ fontSize: '.8rem' }}>{t.start_location} → {t.destination}</td>
                    <td>
                      <span style={{ color: getScoreColor(t.driver_score), fontWeight: 700 }}>{fmtNum(t.driver_score)}</span>
                    </td>
                    <td style={{ color: t.harsh_braking_count > 5 ? 'var(--danger)' : 'var(--success)' }}>{t.harsh_braking_count}</td>
                    <td style={{ color: t.sudden_acceleration_count > 5 ? 'var(--danger)' : 'var(--success)' }}>{t.sudden_acceleration_count}</td>
                    <td style={{ color: t.overspeed_count > 2 ? 'var(--danger)' : 'var(--success)' }}>{t.overspeed_count}</td>
                    <td>{fmtNum(t.speed_kmph)} km/h</td>
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
