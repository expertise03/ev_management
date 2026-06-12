import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import toast from 'react-hot-toast'

const DEMO_ACCOUNTS = [
  { label: 'Manager', name: 'Manager_01', id: 'MGR001', password: 'Admin@123', role: 'manager' as const, color: '#00D4AA' },
  { label: 'Manager', name: 'Manager_02', id: 'MGR002', password: 'Admin@123', role: 'manager' as const, color: '#3B82F6' },
  { label: 'Driver',  name: 'Driver_001', id: 'DR0001', password: 'Driver@123', role: 'driver' as const, color: '#F59E0B' },
  { label: 'Driver',  name: 'Driver_002', id: 'DR0002', password: 'Driver@123', role: 'driver' as const, color: '#F59E0B' },
  { label: 'Driver',  name: 'Driver_003', id: 'DR0003', password: 'Driver@123', role: 'driver' as const, color: '#EF4444' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)
  const { managers, drivers } = useDataStore()

  const [tab, setTab] = useState<'manager' | 'driver'>('manager')
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  // password store in localStorage
  const getAdminPasswords = () => {
    const s = localStorage.getItem('vf_admin_pw')
    if (!s) {
      const d: Record<string, string> = {}
      managers.forEach(m => { d[m.manager_id] = 'Admin@123' })
      localStorage.setItem('vf_admin_pw', JSON.stringify(d))
      return d
    }
    return JSON.parse(s)
  }

  const getDriverPasswords = () => {
    const s = localStorage.getItem('vf_driver_pw')
    if (!s) {
      const d: Record<string, string> = {}
      drivers.forEach(dr => { d[dr.driver_id] = 'Driver@123' })
      localStorage.setItem('vf_driver_pw', JSON.stringify(d))
      return d
    }
    return JSON.parse(s)
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const uid = id.trim().toUpperCase()

    if (tab === 'manager') {
      const mgr = managers.find(m => m.manager_id === uid)
      if (!mgr) { setError('Manager ID not found.'); return }
      const pws = getAdminPasswords()
      if (pws[uid] !== password) { setError('Incorrect password.'); return }
      login({ id: mgr.manager_id, name: mgr.manager_name, email: mgr.manager_email, role: 'manager' })
      toast.success(`Welcome back, ${mgr.manager_name}!`)
      navigate('/manager/dashboard')
    } else {
      // Driver login — accept DR#### format
      const drv = drivers.find(d => d.driver_id === uid || d.email.toLowerCase() === id.toLowerCase())
      if (!drv) { setError('Driver ID not found. Use format DR0001 or your registered email.'); return }
      const pws = getDriverPasswords()
      if (pws[drv.driver_id] !== password) { setError('Incorrect password. Default is Driver@123'); return }
      login({ id: drv.driver_id, name: drv.driver_name, email: drv.email, role: 'driver', managerId: drv.fleet_manager_id })
      toast.success(`Welcome, ${drv.driver_name}!`)
      navigate('/driver/dashboard')
    }
  }

  const autofill = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setTab(acc.role)
    setId(acc.id)
    setPassword(acc.password)
    setError('')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--secondary)' }}>
      {/* Left panel */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #0d1225 0%, #1a2040 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', borderRight: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem' }}>⚡ VoltFleet</div>
        <p style={{ color: 'var(--muted)', maxWidth: 360, textAlign: 'center', lineHeight: 1.7, marginBottom: '3rem' }}>
          Real-Time EV Fleet Monitoring & Predictive Analytics Platform
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%', maxWidth: 380 }}>
          {[['240+', 'Drivers'], ['12', 'Managers'], ['5000+', 'Trips'], ['99.9%', 'Uptime']].map(([v, l]) => (
            <div key={l} style={{ background: 'rgba(0,212,170,.08)', border: '1px solid rgba(0,212,170,.2)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>{v}</div>
              <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, marginBottom: '.4rem' }}>Welcome Back</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '2rem', fontSize: '.9rem' }}>Login to your VoltFleet account</p>

          {/* Role Tabs */}
          <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 10, padding: '.3rem', marginBottom: '1.5rem', gap: '.3rem' }}>
            {(['manager', 'driver'] as const).map(r => (
              <button key={r} onClick={() => { setTab(r); setError('') }}
                style={{ flex: 1, padding: '.5rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '.86rem', fontFamily: 'var(--font-display)', transition: 'all .2s',
                  background: tab === r ? 'var(--primary)' : 'transparent',
                  color: tab === r ? '#000' : 'var(--muted)',
                }}>
                {r === 'manager' ? '🛡️ Manager' : '🚗 Driver'}
              </button>
            ))}
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '.7rem 1rem', fontSize: '.84rem', color: 'var(--danger)', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="fg">
              <label className="label">{tab === 'manager' ? 'Manager ID (e.g. MGR001)' : 'Driver ID (e.g. DR0001)'}</label>
              <input className="input" value={id} onChange={e => setId(e.target.value)}
                placeholder={tab === 'manager' ? 'MGR001' : 'DR0001'} required autoComplete="off" />
            </div>
            <div className="fg">
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="Enter password" required
                  style={{ paddingRight: '2.8rem' }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: '.8rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1rem' }}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block" style={{ padding: '.75rem', fontSize: '1rem', borderRadius: 10, marginTop: '.5rem' }}>
              Login as {tab === 'manager' ? 'Manager' : 'Driver'}
            </button>
          </form>

          {/* Demo tiles */}
          <div style={{ marginTop: '2rem' }}>
            <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginBottom: '.75rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '.5px' }}>Quick Demo Login</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
              {DEMO_ACCOUNTS.map(a => (
                <button key={a.id} onClick={() => autofill(a)}
                  style={{ padding: '.35rem .9rem', borderRadius: 8, border: `1px solid ${a.color}33`, background: `${a.color}11`, color: a.color, fontSize: '.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all .2s', fontFamily: 'var(--font-mono)' }}>
                  {a.id}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: '.6rem', textAlign: 'center' }}>
              Managers: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>Admin@123</code> &nbsp;|&nbsp;
              Drivers: <code style={{ fontFamily: 'var(--font-mono)', color: '#F59E0B' }}>Driver@123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
