import { useDataStore } from '@/store/dataStore'

export default function LoadingScreen() {
  const { loadProgress, loadStatus } = useDataStore()
  return (
    <div className="loading-screen">
      <div className="loading-logo">⚡ VoltFleet</div>
      <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>Real-Time EV Fleet Management</p>
      <div className="loading-bar-track">
        <div className="loading-bar-fill" style={{ width: `${loadProgress}%` }} />
      </div>
      <div className="loading-status">{loadStatus}</div>
    </div>
  )
}
