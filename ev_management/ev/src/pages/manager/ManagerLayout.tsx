import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

const NAV = [
  { to: 'dashboard', icon: '📊', label: 'Dashboard' },
  { to: 'fleet',     icon: '🚗', label: 'Fleet Overview' },
  { to: 'drivers',   icon: '👥', label: 'My Drivers' },
  { to: 'battery',   icon: '🔋', label: 'Battery Health' },
  { to: 'behavior',  icon: '🧠', label: 'Behaviour' },
  { to: 'cost',      icon: '💰', label: 'Cost Analysis' },
  { to: 'reports',   icon: '📄', label: 'Reports' },
]

export default function ManagerLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">⚡ Volt<span>Fleet</span></div>
        <nav className="sidebar-nav">
          <div className="nav-label">Management</div>
          {NAV.map(n => (
            <NavLink key={n.to} to={`/manager/${n.to}`}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <span>{n.icon}</span> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{(user?.name || 'M')[0]}</div>
            <div>
              <div className="name">{user?.name}</div>
              <div className="role-lbl">Fleet Manager</div>
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
