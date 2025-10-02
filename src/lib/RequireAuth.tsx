import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './auth'

export default function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div style={{ color: 'var(--muted)' }}>Loading...</div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}
