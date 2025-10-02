import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import SectionHeader from '../components/SectionHeader'
import { useAdminAuth } from '../lib/adminAuth'

export default function AdminLogin() {
  const { login } = useAdminAuth()
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation() as any

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      const ok = await login(id, password)
      if (!ok) {
        setStatus('Invalid admin credentials')
        return
      }
      const to = (location?.state?.from?.pathname as string) || '/admin'
      navigate(to, { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page-center">
      <div className="auth-card" style={{ width: '100%', maxWidth: 440 }}>
        <div className="h1" style={{ marginBottom: 6 }}>Admin Login</div>
        <div className="h2" style={{ marginBottom: 14 }}>Sign in with admin ID and password</div>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <label className="field">
            <span className="p">Admin ID</span>
            <input className="input" value={id} onChange={(e) => setId(e.target.value)} required />
          </label>
          <label className="field">
            <span className="p">Password</span>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button disabled={loading} type="submit">{loading ? 'Signing in...' : 'Sign in'}</Button>
            {status ? <span className="p" role="status">{status}</span> : null}
          </div>
        </form>
      </div>
    </section>
  )
}
