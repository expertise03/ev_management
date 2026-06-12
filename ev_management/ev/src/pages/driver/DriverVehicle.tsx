import { useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { fmtRs, fmtNum, getBattColor } from '@/utils/format'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.55rem 0', borderBottom: '1px solid var(--border)', fontSize: '.85rem' }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span><span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  )
}

export default function DriverVehicle() {
  const user = useAuthStore(s => s.user)
  const { getDriverTrips } = useDataStore()
  const trips = useMemo(() => getDriverTrips(user?.id || ''), [user, getDriverTrips])
  const v = trips[0]

  if (!v) return <div className="page"><div style={{ padding: '1.8rem', color: 'var(--muted)' }}>No vehicle data found.</div></div>

  const battColor = getBattColor(v.battery_percentage)

  return (
    <div className="page fade-up">
      <div className="topbar"><div className="topbar-title">🚗 My Vehicle</div></div>
      <div style={{ padding: '1.8rem' }}>
        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          {/* Vehicle profile */}
          <div className="card">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(0,212,170,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>🚗</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>{v.vehicle_make} {v.vehicle_model}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '.78rem', color: 'var(--primary)' }}>{v.vehicle_id}</div>
                <span className={`badge ${v.vehicle_status === 'Active' ? 'badge-success' : 'badge-danger'}`} style={{ marginTop: '.3rem' }}>{v.vehicle_status}</span>
              </div>
            </div>
            <InfoRow label="Registration" value={v.registration_number} />
            <InfoRow label="Type" value={v.car_type} />
            <InfoRow label="Year" value={String(v.manufacture_year)} />
            <InfoRow label="Battery Capacity" value={v.battery_capacity_kwh + ' kWh'} />
            <InfoRow label="VIN" value={v.vin} />
            <InfoRow label="Weight" value={v.vehicle_weight_kg + ' kg'} />
            <InfoRow label="Insurance Expiry" value={v.insurance_expiry} />
          </div>

          {/* Live battery */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.2rem' }}>⚡ Live Battery Status</h3>
            <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
              <svg width="160" height="90" viewBox="0 0 160 90">
                <rect x="5" y="15" width="145" height="65" rx="8" fill="rgba(255,255,255,.06)" stroke={battColor} strokeWidth="2"/>
                <rect x="150" y="30" width="8" height="30" rx="3" fill={battColor} opacity="0.6"/>
                <rect x="12" y="22" width={`${(v.battery_percentage / 100) * 131}`} height="51" rx="5" fill={battColor} opacity="0.85"/>
                <text x="80" y="53" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="800" fontFamily="Space Grotesk">{v.battery_percentage}%</text>
              </svg>
            </div>
            <InfoRow label="Health" value={v.battery_health_percent + '%'} />
            <InfoRow label="Temperature" value={fmtNum(v.battery_temperature) + '°C'} />
            <InfoRow label="Voltage" value={fmtNum(v.battery_voltage) + ' V'} />
            <InfoRow label="Charging Cycles" value={String(v.charging_cycles)} />
            <InfoRow label="Charging Status" value={v.charging_status} />
            <InfoRow label="Last Charge Cost" value={fmtRs(v.charging_cost_rs)} />
          </div>
        </div>

        {/* Maintenance */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1.2rem' }}>🔧 Maintenance & Telemetry</h3>
          <div className="grid-2">
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.3rem', fontSize: '.78rem' }}>
                  <span style={{ color: 'var(--muted)' }}>Tire Health</span>
                  <span style={{ color: v.tire_health_percent > 70 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{v.tire_health_percent}%</span>
                </div>
                <div className="prog-track"><div className={`prog-fill ${v.tire_health_percent > 70 ? 'prog-green' : 'prog-red'}`} style={{ width: `${v.tire_health_percent}%` }} /></div>
              </div>
              <InfoRow label="Last Service" value={v.last_service_days + ' days ago'} />
              <InfoRow label="Service Status" value={v.last_service_days < 180 ? '✓ Up to date' : '⚠️ Overdue'} />
              <InfoRow label="Maintenance Cost" value={fmtRs(v.maintenance_cost_rs)} />
              <InfoRow label="Alert" value={v.maintenance_alert || 'None'} />
            </div>
            <div>
              <InfoRow label="Motor Speed" value={v.motor_speed_rpm + ' RPM'} />
              <InfoRow label="Motor Temp" value={fmtNum(v.motor_temperature) + '°C'} />
              <InfoRow label="Motor Efficiency" value={fmtNum(v.motor_efficiency) + '%'} />
              <InfoRow label="Speed" value={fmtNum(v.speed_kmph) + ' km/h'} />
              <InfoRow label="Remaining Range" value={fmtNum(v.remaining_range_km) + ' km'} />
              <InfoRow label="Load" value={fmtNum(v.load_weight_kg) + ' kg'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
