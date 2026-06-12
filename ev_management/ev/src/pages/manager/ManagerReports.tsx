import { useState, useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { fmtNum, fmtRs, avg, sum } from '@/utils/format'
import toast from 'react-hot-toast'

const REPORT_TYPES = [
  { id: 'summary',     label: '📊 Fleet Summary' },
  { id: 'energy',      label: '⚡ Energy Consumption' },
  { id: 'behaviour',   label: '🧠 Driver Behaviour' },
  { id: 'maintenance', label: '🔧 Maintenance Status' },
  { id: 'battery',     label: '🔋 Battery Health' },
]

export default function ManagerReports() {
  const user = useAuthStore(s => s.user)
  const { getManagerTrips } = useDataStore()
  const trips = useMemo(() => getManagerTrips(user?.id || ''), [user, getManagerTrips])
  const [type, setType] = useState('summary')
  const [preview, setPreview] = useState<{ headers: string[]; rows: (string | number)[][] } | null>(null)

  const generateReport = () => {
    const seen = new Set<string>()
    const vehicles = trips.filter(t => { if (seen.has(t.vehicle_id)) return false; seen.add(t.vehicle_id); return true })
    let headers: string[] = []
    let rows: (string | number)[][] = []

    if (type === 'summary') {
      headers = ['Vehicle', 'Driver', 'Status', 'Battery %', 'Health %', 'Trip Cost ₹']
      rows = vehicles.map(t => [t.vehicle_id, t.driver_id, t.vehicle_status, t.battery_percentage, t.battery_health_percent, fmtNum(t.total_trip_cost, 2)])
    } else if (type === 'energy') {
      headers = ['Driver', 'Vehicle', 'Energy kWh', 'Daily Cost ₹', 'Monthly Cost ₹', 'Cost/km ₹']
      rows = trips.slice(0, 50).map(t => [t.driver_id, t.vehicle_id, fmtNum(t.energy_consumed_kwh), fmtNum(t.daily_energy_cost, 2), fmtNum(t.monthly_energy_cost, 2), fmtNum(t.cost_per_km)])
    } else if (type === 'behaviour') {
      headers = ['Driver', 'Score', 'Harsh Braking', 'Sudden Accel', 'Overspeed', 'Rating']
      rows = trips.slice(0, 50).map(t => [t.driver_id, fmtNum(t.driver_score), t.harsh_braking_count, t.sudden_acceleration_count, t.overspeed_count, t.driver_score >= 75 ? 'Good' : t.driver_score >= 50 ? 'Average' : 'Poor'])
    } else if (type === 'maintenance') {
      headers = ['Vehicle', 'Registration', 'Tire Health %', 'Last Service (days)', 'Maint Cost ₹', 'Alert']
      rows = vehicles.map(t => [t.vehicle_id, t.registration_number, t.tire_health_percent, t.last_service_days, fmtNum(t.maintenance_cost_rs, 2), t.maintenance_alert || 'None'])
    } else if (type === 'battery') {
      headers = ['Vehicle', 'Battery %', 'Health %', 'Temp °C', 'Cycles', 'Charging Status']
      rows = vehicles.map(t => [t.vehicle_id, t.battery_percentage, t.battery_health_percent, fmtNum(t.battery_temperature), t.charging_cycles, t.charging_status])
    }
    setPreview({ headers, rows })
  }

  const downloadCSV = () => {
    if (!preview) return
    const csv = [preview.headers.join(','), ...preview.rows.map(r => r.join(','))].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `voltfleet_${type}_report.csv`
    a.click()
    toast.success('Report downloaded!')
  }

  return (
    <div className="page fade-up">
      <div className="topbar"><div className="topbar-title">📄 Reports</div></div>
      <div style={{ padding: '1.8rem' }}>
        <div className="card" style={{ maxWidth: 600, marginBottom: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.2rem' }}>Generate Report</h3>
          <div className="fg">
            <label className="label">Report Type</label>
            <select className="input" value={type} onChange={e => setType(e.target.value)}>
              {REPORT_TYPES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '.75rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={generateReport}>Preview Report</button>
            {preview && <button className="btn btn-outline" onClick={downloadCSV}>⬇ Download CSV</button>}
          </div>
        </div>

        {preview && (
          <div className="card fade-up">
            <div className="sec-head">
              <h3>{REPORT_TYPES.find(r => r.id === type)?.label}</h3>
              <span className="badge badge-primary">{preview.rows.length} rows</span>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead><tr>{preview.headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
