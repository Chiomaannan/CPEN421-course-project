import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import NewIncident from './pages/NewIncident'
import DispatchStatus from './pages/DispatchStatus'
import VehicleTracking from './pages/VehicleTracking'
import Analytics from './pages/Analytics'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/dispatch" replace />} />
              <Route path="/dispatch" element={<DispatchStatus />} />
              <Route path="/incidents/new" element={<NewIncident />} />
              <Route path="/tracking" element={<VehicleTracking />} />
              <Route path="/analytics" element={<Analytics />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
