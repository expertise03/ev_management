import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

const NAV = [
  { to: 'dashboard',   icon: '📊', label: 'Dashboard' },
  { to: 'trips',       icon: '🗺️', label: 'My Trips' },
  { to: 'vehicle',     icon: '🚗', label: 'My Vehicle' },
  { to: 'performance', icon: '🧠', label: 'Performance' },
]

export default function DriverLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">⚡ Volt<span>Fleet</span></div>
        <nav className="sidebar-nav">
          <div className="nav-label">Driver Portal</div>
          {NAV.map(n => (
            <NavLink key={n.to} to={`/driver/${n.to}`}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <span>{n.icon}</span> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar" style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}>
              {(user?.name || 'D')[0]}
            </div>
            <div>
              <div className="name">{user?.name}</div>
              <div className="role-lbl">Fleet Driver</div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </aside>
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  )
}
