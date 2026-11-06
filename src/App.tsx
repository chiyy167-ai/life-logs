import type { ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CalendarPage } from './pages/CalendarPage'
import { DayPage } from './pages/DayPage'
import { SettingsPage } from './pages/SettingsPage'
import { SetupPage } from './pages/SetupPage'
import { TimelinePage } from './pages/TimelinePage'
import { UnlockPage } from './pages/UnlockPage'

function Gate({ children }: { children: ReactNode }) {
  const { ready, configured, unlocked } = useAuth()
  if (!ready) {
    return (
      <div className="gate-page">
        <p className="brand">Life Logs</p>
        <p className="muted">加载中…</p>
      </div>
    )
  }
  if (!configured) return <SetupPage />
  if (!unlocked) return <UnlockPage />
  return children
}

function AppRoutes() {
  return (
    <Gate>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DayPage />} />
          <Route path="day/:date" element={<DayPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="timeline" element={<TimelinePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Gate>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  )
}
