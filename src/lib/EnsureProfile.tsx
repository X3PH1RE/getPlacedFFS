import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './auth'
import { hasProfile } from './profile'

export default function EnsureProfile() {
  const { user } = useAuth()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [exists, setExists] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    async function run() {
      if (!user) return

      // One-time bypass if we just saved profile
      const bypass = localStorage.getItem('profile-complete') === '1'
      if (bypass) {
        localStorage.removeItem('profile-complete')
        setExists(true)
        setLoading(false)
        return
      }

      try {
        const ok = await hasProfile(user.id)
        if (!active) return
        setExists(ok)
      } catch (e) {
        console.warn('EnsureProfile: failed to count profile', e)
        setExists(false)
      } finally {
        setLoading(false)
      }
    }
    run()
    return () => { active = false }
  }, [user])

  if (loading) return null
  if (!exists) return <Navigate to="/setup" replace state={{ from: location }} />
  return <Outlet />
}
