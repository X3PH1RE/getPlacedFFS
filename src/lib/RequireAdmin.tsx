import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdminAuth } from './adminAuth'

export default function RequireAdmin() {
  const { isAdmin } = useAdminAuth()
  const location = useLocation()
  if (!isAdmin) return <Navigate to="/admin-login" replace state={{ from: location }} />
  return <Outlet />
}
