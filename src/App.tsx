import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from './lib/auth'
import Button from './components/Button'

function App() {
  const { user, signOut } = useAuth()

  return (
    <div style={{minHeight: '100dvh', display: 'flex', flexDirection: 'column'}}>
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="brand">getPlacedFFS</Link>
          <nav className="nav">
            <NavLink to="/" end style={({ isActive }) => ({ color: isActive ? 'var(--text)' : undefined, background: isActive ? 'rgba(255,255,255,0.06)' : undefined })}>Dashboard</NavLink>
            <NavLink to="/profile" style={({ isActive }) => ({ color: isActive ? 'var(--text)' : undefined, background: isActive ? 'rgba(255,255,255,0.06)' : undefined })}>Profile</NavLink>
            {user ? (
              <span style={{ marginLeft: 12 }}>
                <span className="p" style={{ marginRight: 8 }}>{user.email ?? user.id}</span>
                <Button variant="ghost" onClick={() => signOut()}>Sign out</Button>
              </span>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="container" style={{ flex: 1 }}>
        <Outlet />
      </main>
      <footer className="footer">
        <div>© {new Date().getFullYear()} getPlacedFFS</div>
        <div style={{ marginTop: 8, fontSize: '14px', color: 'var(--muted)' }}>
          If any issues with the app,{' '}
          <a 
            href="https://wa.me/917400391105" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: 'var(--primary)', textDecoration: 'none' }}
          >
            whatsapp cheytha mathi
          </a>
          , call cheyyalle pls🙂🙏
        </div>
      </footer>
    </div>
  )
}

export default App
