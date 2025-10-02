import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Button from '../components/Button'
import { useAuth } from '../lib/auth'

export default function Login() {
  const { user, signOut } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation() as any

  const redirectTo = useMemo(() => (
    (location?.state?.from?.pathname as string) || '/'
  ), [location])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      }
      navigate(redirectTo, { replace: true })
    } catch (err: any) {
      setStatus(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  if (user) {
    return (
      <section className="page-center">
        <div className="auth-card" style={{ width: '100%', maxWidth: 440 }}>
          <div className="h1" style={{ marginBottom: 6 }}>You are signed in</div>
          <div className="p" style={{ marginBottom: 16 }}>{user.email ?? user.id}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to="/admin-login" className="link">Admin login</Link>
            <Button onClick={() => signOut()}>Sign out</Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="page-center">
      <div className="auth-card">
        <div style={{ display: 'grid', gap: 8, marginBottom: 10 }}>
          <div className="h1">{mode === 'login' ? 'Welcome back' : 'Create your account'}</div>
          <div className="h2">{mode === 'login' ? 'Sign in with email and password' : 'Sign up with email and password'}</div>
        </div>
        <div className="tabs" style={{ marginBottom: 14 }}>
          <button className={["tab", mode === 'login' ? 'tab-active' : ''].join(' ')} onClick={() => setMode('login')}>Login</button>
          <button className={["tab", mode === 'signup' ? 'tab-active' : ''].join(' ')} onClick={() => setMode('signup')}>Sign up</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <label className="field">
            <span className="p">Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              autoComplete={mode === 'login' ? 'email' : 'new-email'}
            />
          </label>
          <label className="field">
            <span className="p">Password</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={mode === 'login' ? 'Your password' : 'Create a password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button disabled={loading} type="submit">
              {loading ? <span className="spinner" aria-hidden /> : null}
              {loading ? (mode === 'login' ? 'Signing in...' : 'Creating account...') : (mode === 'login' ? 'Sign in' : 'Sign up')}
            </Button>
            {status ? <span className="p" role="status">{status}</span> : null}
          </div>
        </form>
        <div className="divider" />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="muted">Admin?</span>
          <Link to="/admin-login" className="link">Go to admin login</Link>
        </div>
      </div>
    </section>
  )
}
