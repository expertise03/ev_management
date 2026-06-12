import { useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { avg, sum, fmtRs, fmtNum } from '@/utils/format'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function ManagerCost() {
  const user = useAuthStore(s => s.user)
  const { getManagerTrips } = useDataStore()
  const trips = useMemo(() => getManagerTrips(user?.id || ''), [user, getManagerTrips])

  const kpis = useMemo(() => ({
    totalEnergy: sum(trips.map(t => t.energy_consumed_kwh)),
    totalCost: sum(trips.map(t => t.total_trip_cost)),
    avgPerKm: avg(trips.map(t => t.cost_per_km)),
    totalMaint: sum(trips.map(t => t.maintenance_cost_rs)),
  }), [trips])

  const monthlyData = useMemo(() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return months.map((m, i) => {
      const monthTrips = trips.filter(t => t.month === ['January','February','March','April','May','June','July','August','September','October','November','December'][i])
      return {
        month: m,
        energy: sum(monthTrips.map(t => t.energy_consumed_kwh)),
        cost: sum(monthTrips.map(t => t.daily_energy_cost)),
        maint: sum(monthTrips.map(t => t.maintenance_cost_rs)),
      }
    }).filter(d => d.cost > 0)
  }, [trips])

  const driverCosts = useMemo(() => {
    const map: Record<string, number[]> = {}
    trips.forEach(t => { if (!map[t.driver_id]) map[t.driver_id] = []; map[t.driver_id].push(t.total_trip_cost) })
    return Object.entries(map).map(([id, costs]) => ({ id, total: sum(costs), avg: avg(costs) })).sort((a, b) => b.total - a.total)
  }, [trips])

  return (
    <div className="page fade-up">
      <div className="topbar"><div className="topbar-title">💰 Cost Analysis</div></div>
      <div style={{ padding: '1.8rem' }}>
        <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
          {[
            { icon: '⚡', bg: 'rgba(0,212,170,.15)', val: fmtNum(kpis.totalEnergy) + ' kWh', lbl: 'Total Energy' },
            { icon: '💰', bg: 'rgba(59,130,246,.15)', val: fmtRs(kpis.totalCost), lbl: 'Total Trip Cost' },
            { icon: '🛣️', bg: 'rgba(245,158,11,.15)', val: '₹' + fmtNum(kpis.avgPerKm) + '/km', lbl: 'Avg Cost/KM' },
            { icon: '🔧', bg: 'rgba(239,68,68,.15)',  val: fmtRs(kpis.totalMaint), lbl: 'Maintenance Cost' },
          ].map(k => (
            <div key={k.lbl} className="kpi-card">
              <div className="kpi-icon" style={{ background: k.bg }}>{k.icon}</div>
              <div><div className="kpi-val">{k.val}</div><div className="kpi-lbl">{k.lbl}</div></div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          <div className="card">
            <div className="sec-head"><h3>📆 Monthly Energy Cost Trend</h3></div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00D4AA" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
                <XAxis dataKey="month" stroke="#9BA3C7" fontSize={11} />
                <YAxis stroke="#9BA3C7" fontSize={11} />
                <Tooltip contentStyle={{ background: '#2D3555', border: '1px solid #3A4268', borderRadius: 8 }}
                  formatter={(v: number) => fmtRs(v)} />
                <Area type="monotone" dataKey="cost" stroke="#00D4AA" strokeWidth={2} fill="url(#cg)" name="Energy Cost" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="sec-head"><h3>🔧 Energy vs Maintenance Cost</h3></div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
                <XAxis dataKey="month" stroke="#9BA3C7" fontSize={11} />
                <YAxis stroke="#9BA3C7" fontSize={11} />
                <Tooltip contentStyle={{ background: '#2D3555', border: '1px solid #3A4268', borderRadius: 8 }}
                  formatter={(v: number) => fmtRs(v)} />
                <Bar dataKey="energy" fill="#00D4AA" name="Energy" radius={[4,4,0,0]} />
                <Bar dataKey="maint" fill="#EF4444" name="Maintenance" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="sec-head"><h3>💸 Cost per Driver</h3></div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Driver</th><th>Total Trip Cost</th><th>Avg per Trip</th><th>Share</th></tr></thead>
              <tbody>
                {driverCosts.map(d => (
                  <tr key={d.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'var(--primary)' }}>{d.id}</td>
                    <td>{fmtRs(d.total)}</td>
                    <td>{fmtRs(d.avg)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 3 }}>
                          <div style={{ width: `${(d.total / kpis.totalCost) * 100}%`, height: '100%', borderRadius: 3, background: 'var(--primary)' }} />
                        </div>
                        <span style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{fmtNum((d.total / kpis.totalCost) * 100)}%</span>
                      </div>
                    </td>
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
