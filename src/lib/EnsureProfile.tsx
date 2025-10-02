import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './auth'
import { getProfile } from './profile'

export default function EnsureProfile() {
  const { user } = useAuth()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [allow, setAllow] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    async function run() {
      if (!user) return

      // If browser already marked profile as complete, allow
      const wasCompleted = localStorage.getItem('profile-complete') === '1'
      if (wasCompleted) {
        setAllow(true)
        setLoading(false)
        return
      }

      try {
        const data = await getProfile(user.id)
        if (!active) return
        if (data) {
          // Persist completion for future logins in this browser
          localStorage.setItem('profile-complete', '1')
          setAllow(true)
        } else {
          setAllow(false)
        }
      } catch (_e) {
        setAllow(false)
      } finally {
        setLoading(false)
      }
    }
    run()
    return () => { active = false }
  }, [user])

  if (loading) return null
  if (!allow) return <Navigate to="/setup" replace state={{ from: location }} />
  return <Outlet />
}
