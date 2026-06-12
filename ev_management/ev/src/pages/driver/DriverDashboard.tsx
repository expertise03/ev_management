import { useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { avg, sum, fmtRs, fmtNum, getBattColor, getScoreColor } from '@/utils/format'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.55rem 0', borderBottom: '1px solid var(--border)', fontSize: '.85rem' }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  )
}

export default function DriverDashboard() {
  const user = useAuthStore(s => s.user)
  const { getDriverTrips } = useDataStore()
  const trips = useMemo(() => getDriverTrips(user?.id || ''), [user, getDriverTrips])
  const latest = trips[0]

  const stats = useMemo(() => ({
    totalDist: sum(trips.map(t => t.distance_travelled_km)),
    totalCost: sum(trips.map(t => t.total_trip_cost)),
    avgScore: avg(trips.map(t => t.driver_score)),
    totalEnergy: sum(trips.map(t => t.energy_consumed_kwh)),
  }), [trips])

  const alerts = useMemo(() => {
    if (!latest) return []
    const a: { cls: string; icon: string; title: string; sub: string }[] = []
    if (latest.battery_percentage < 20) a.push({ cls: '#EF4444', icon: '🔴', title: 'Critical Battery', sub: `${latest.battery_percentage}% — charge immediately` })
    if (latest.battery_percentage < 30) a.push({ cls: '#F59E0B', icon: '⚠️', title: 'Low Battery', sub: `${latest.battery_percentage}% — find a charging station` })
    if (latest.battery_health_percent < 85) a.push({ cls: '#F59E0B', icon: '🔋', title: 'Battery Health Low', sub: `Health: ${latest.battery_health_percent}%` })
    if (latest.tire_health_percent < 60) a.push({ cls: '#F59E0B', icon: '🔧', title: 'Tire Wear', sub: `Tire health: ${latest.tire_health_percent}%` })
    if (latest.driver_score < 50) a.push({ cls: '#F59E0B', icon: '🧠', title: 'Low Eco Score', sub: `Score: ${fmtNum(latest.driver_score)} — check performance tab` })
    return a
  }, [latest])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const scoreColor = getScoreColor(stats.avgScore)
  const r = 52; const circ = 2 * Math.PI * r
  const scoreStroke = circ * (1 - stats.avgScore / 100)

  if (!latest) return (
    <div className="page">
      <div className="topbar"><div className="topbar-title">📊 My Dashboard</div></div>
      <div style={{ padding: '1.8rem', color: 'var(--muted)' }}>No trip data found for {user?.id}. Contact your fleet manager.</div>
    </div>
  )

  return (
    <div className="page fade-up">
      <div className="topbar">
        <div className="topbar-title">📊 Driver Dashboard</div>
        <div className="topbar-right">
          <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{user?.id}</span>
        </div>
      </div>
      <div style={{ padding: '1.8rem' }}>
        {/* Welcome */}
        <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(0,212,170,.1), rgba(59,130,246,.08))', borderColor: 'rgba(0,212,170,.2)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700 }}>{greeting}, {user?.name?.replace('Driver_', 'Driver ') || 'Driver'}! 👋</div>
          <p style={{ color: 'var(--muted)', fontSize: '.88rem', marginTop: '.3rem' }}>Vehicle: {latest.vehicle_id} · {latest.vehicle_make} {latest.vehicle_model}</p>
        </div>

        {/* KPIs */}
        <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
          {[
            { icon: '🔋', bg: `${getBattColor(latest.battery_percentage)}22`, val: latest.battery_percentage + '%', lbl: 'Current Battery' },
            { icon: '🛣️', bg: 'rgba(0,212,170,.15)', val: fmtNum(stats.totalDist) + ' km', lbl: 'Total Distance' },
            { icon: '🧠', bg: `${scoreColor}22`, val: fmtNum(stats.avgScore), lbl: 'Avg Eco Score' },
            { icon: '⚡', bg: 'rgba(59,130,246,.15)', val: fmtNum(stats.totalEnergy) + ' kWh', lbl: 'Energy Used' },
            { icon: '💰', bg: 'rgba(245,158,11,.15)', val: fmtRs(stats.totalCost), lbl: 'Total Cost' },
            { icon: '📍', bg: 'rgba(0,212,170,.15)', val: fmtNum(latest.remaining_range_km) + ' km', lbl: 'Remaining Range' },
          ].map(k => (
            <div key={k.lbl} className="kpi-card">
              <div className="kpi-icon" style={{ background: k.bg }}>{k.icon}</div>
              <div><div className="kpi-val">{k.val}</div><div className="kpi-lbl">{k.lbl}</div></div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          {/* Battery */}
          <div className="card">
            <div className="sec-head">
              <h3>🔋 Battery Status</h3>
              <span className={`badge ${latest.charging_status === 'Fully Charged' ? 'badge-success' : latest.charging_status === 'Charging' ? 'badge-info' : 'badge-warning'}`}>{latest.charging_status}</span>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: '.4rem' }}>
                <span style={{ color: 'var(--muted)' }}>Charge Level</span>
                <span style={{ color: getBattColor(latest.battery_percentage), fontWeight: 700 }}>{latest.battery_percentage}%</span>
              </div>
              <div className="prog-track" style={{ height: 12 }}>
                <div className={`prog-fill ${latest.battery_percentage > 50 ? 'prog-green' : latest.battery_percentage > 25 ? 'prog-amber' : 'prog-red'}`} style={{ width: `${latest.battery_percentage}%` }} />
              </div>
            </div>
            <InfoRow label="Health" value={latest.battery_health_percent + '%'} />
            <InfoRow label="Temperature" value={fmtNum(latest.battery_temperature) + '°C'} />
            <InfoRow label="Voltage" value={fmtNum(latest.battery_voltage) + ' V'} />
            <InfoRow label="Cycles" value={String(latest.charging_cycles)} />
            <InfoRow label="Charger" value={latest.charger_type} />
          </div>

          {/* Eco Score ring */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', alignSelf: 'flex-start' }}>🧠 Eco Score</h3>
            <svg width="150" height="150" viewBox="0 0 150 150">
              <circle cx="75" cy="75" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="10"/>
              <circle cx="75" cy="75" r={r} fill="none" stroke={scoreColor} strokeWidth="10"
                strokeDasharray={circ} strokeDashoffset={scoreStroke} strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '75px 75px', transition: 'stroke-dashoffset 1s ease' }}/>
              <text x="75" y="80" textAnchor="middle" fill={scoreColor} fontSize="26" fontWeight="800" fontFamily="Space Grotesk">{Math.round(stats.avgScore)}</text>
              <text x="75" y="96" textAnchor="middle" fill="#9BA3C7" fontSize="11">/ 100</text>
            </svg>
            <span className={`badge ${stats.avgScore >= 75 ? 'badge-success' : stats.avgScore >= 50 ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '.85rem' }}>
              {stats.avgScore >= 75 ? '⭐ Excellent' : stats.avgScore >= 50 ? '⚠️ Average' : '❌ Needs Improvement'}
            </span>
            <div style={{ width: '100%', marginTop: '.5rem' }}>
              <InfoRow label="Harsh Braking" value={String(latest.harsh_braking_count)} />
              <InfoRow label="Sudden Accel" value={String(latest.sudden_acceleration_count)} />
              <InfoRow label="Overspeed Events" value={String(latest.overspeed_count)} />
            </div>
          </div>
        </div>

        {/* Current trip */}
        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-display)' }}>📍 Latest Trip</h3>
            <InfoRow label="From" value={latest.start_location} />
            <InfoRow label="To" value={latest.destination} />
            <InfoRow label="Distance" value={fmtNum(latest.distance_travelled_km) + ' km'} />
            <InfoRow label="Duration" value={latest.trip_duration_min + ' min'} />
            <InfoRow label="Speed" value={fmtNum(latest.speed_kmph) + ' km/h'} />
            <InfoRow label="Weather" value={latest.weather_condition} />
            <InfoRow label="Traffic" value={latest.traffic_level} />
            <InfoRow label="Energy Used" value={fmtNum(latest.energy_consumed_kwh) + ' kWh'} />
            <InfoRow label="Trip Cost" value={fmtRs(latest.total_trip_cost)} />
          </div>

          {/* Alerts */}
          <div className="card">
            <div className="sec-head"><h3>🔔 My Alerts</h3></div>
            {alerts.length ? alerts.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: '.7rem', padding: '.65rem', background: 'rgba(255,255,255,.03)', borderRadius: 8, borderLeft: `3px solid ${a.cls}`, marginBottom: '.5rem' }}>
                <span>{a.icon}</span>
                <div><div style={{ fontSize: '.84rem', fontWeight: 600 }}>{a.title}</div><div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{a.sub}</div></div>
              </div>
            )) : (
              <p style={{ color: 'var(--success)', fontSize: '.88rem' }}>✅ No alerts — great driving!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
