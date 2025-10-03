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
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null)
  const navigate = useNavigate()
  const location = useLocation() as any

  const redirectTo = useMemo(() => (
    (location?.state?.from?.pathname as string) || '/'
  ), [location])

  const isFormValid = useMemo(() => {
    if (mode === 'login') {
      return email.length > 0 && password.length > 0
    } else {
      return email.length > 0 && password.length >= 6 && password === confirmPassword
    }
  }, [mode, email, password, confirmPassword])

  function clearForm() {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setStatus(null)
    setPasswordStrength(null)
  }

  function calculatePasswordStrength(password: string): 'weak' | 'medium' | 'strong' | null {
    if (password.length === 0) return null
    if (password.length < 6) return 'weak'
    if (password.length < 10) return 'medium'
    return 'strong'
  }

  function handlePasswordChange(value: string) {
    setPassword(value)
    if (mode === 'signup') {
      setPasswordStrength(calculatePasswordStrength(value))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        // Validate password confirmation for signup
        if (password !== confirmPassword) {
          setStatus('Passwords do not match')
          setLoading(false)
          return
        }
        if (password.length < 6) {
          setStatus('Password must be at least 6 characters long')
          setLoading(false)
          return
        }
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
          <button 
            className={["tab", mode === 'login' ? 'tab-active' : ''].join(' ')} 
            onClick={() => {
              setMode('login')
              clearForm()
            }}
          >
            Login
          </button>
          <button 
            className={["tab", mode === 'signup' ? 'tab-active' : ''].join(' ')} 
            onClick={() => {
              setMode('signup')
              clearForm()
            }}
          >
            Sign up
          </button>
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
            <div className="password-field">
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
                placeholder={mode === 'login' ? 'Your password' : 'Create a password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {mode === 'signup' && passwordStrength && (
              <div className={`password-strength ${passwordStrength}`}>
                {passwordStrength === 'weak' && 'Weak password'}
                {passwordStrength === 'medium' && 'Good password'}
                {passwordStrength === 'strong' && 'Strong password'}
              </div>
            )}
          </label>
          {mode === 'signup' && (
            <label className="field">
              <span className="p">Confirm Password</span>
              <div className="password-field">
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <div className="password-strength weak">
                  Passwords do not match
                </div>
              )}
              {confirmPassword && password === confirmPassword && password.length >= 6 && (
                <div className="password-strength strong">
                  Passwords match ✓
                </div>
              )}
            </label>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch' }}>
            <Button 
              disabled={loading || !isFormValid} 
              type="submit" 
              style={{ 
                alignSelf: 'flex-start',
                opacity: !isFormValid ? 0.6 : 1,
                transition: 'opacity 0.2s ease'
              }}
            >
              {loading ? <span className="spinner" aria-hidden /> : null}
              {loading ? (mode === 'login' ? 'Signing in...' : 'Creating account...') : (mode === 'login' ? 'Sign in' : 'Sign up')}
            </Button>
            {status ? (
              <div 
                className="p" 
                role="status" 
                style={{ 
                  textAlign: 'center', 
                  padding: '12px 16px', 
                  background: 'rgba(248,113,113,0.1)', 
                  borderRadius: '10px', 
                  border: '1px solid rgba(248,113,113,0.2)', 
                  color: '#f87171',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>⚠️</span>
                {status}
              </div>
            ) : null}
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
