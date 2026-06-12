import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { loadAllData } from '@/services/csvLoader'
import LoadingScreen from '@/components/LoadingScreen'
import LoginPage from '@/pages/LoginPage'
import ManagerLayout from '@/pages/manager/ManagerLayout'
import ManagerDashboard from '@/pages/manager/ManagerDashboard'
import ManagerFleet from '@/pages/manager/ManagerFleet'
import ManagerDrivers from '@/pages/manager/ManagerDrivers'
import ManagerBattery from '@/pages/manager/ManagerBattery'
import ManagerBehavior from '@/pages/manager/ManagerBehavior'
import ManagerCost from '@/pages/manager/ManagerCost'
import ManagerReports from '@/pages/manager/ManagerReports'
import DriverLayout from '@/pages/driver/DriverLayout'
import DriverDashboard from '@/pages/driver/DriverDashboard'
import DriverTrips from '@/pages/driver/DriverTrips'
import DriverVehicle from '@/pages/driver/DriverVehicle'
import DriverPerformance from '@/pages/driver/DriverPerformance'

function ProtectedRoute({ role, children }: { role: string; children: React.ReactNode }) {
  const user = useAuthStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const { loaded, setLoaded } = useDataStore()
  const user = useAuthStore(s => s.user)

  useEffect(() => {
    loadAllData()
  }, [])

  if (!loaded) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/manager" element={
        <ProtectedRoute role="manager"><ManagerLayout /></ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"  element={<ManagerDashboard />} />
        <Route path="fleet"      element={<ManagerFleet />} />
        <Route path="drivers"    element={<ManagerDrivers />} />
        <Route path="battery"    element={<ManagerBattery />} />
        <Route path="behavior"   element={<ManagerBehavior />} />
        <Route path="cost"       element={<ManagerCost />} />
        <Route path="reports"    element={<ManagerReports />} />
      </Route>

      <Route path="/driver" element={
        <ProtectedRoute role="driver"><DriverLayout /></ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"   element={<DriverDashboard />} />
        <Route path="trips"       element={<DriverTrips />} />
        <Route path="vehicle"     element={<DriverVehicle />} />
        <Route path="performance" element={<DriverPerformance />} />
      </Route>

      <Route path="*" element={
        user
          ? <Navigate to={user.role === 'manager' ? '/manager/dashboard' : '/driver/dashboard'} replace />
          : <Navigate to="/login" replace />
      } />
    </Routes>
  )
}
