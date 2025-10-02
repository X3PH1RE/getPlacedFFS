import { Link, NavLink, Outlet } from 'react-router-dom'

function App() {
  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="brand">getPlacedFFS</Link>
          <nav className="nav">
            <NavLink to="/" end style={({ isActive }) => ({ color: isActive ? 'var(--text)' : undefined, background: isActive ? 'rgba(255,255,255,0.06)' : undefined })}>Dashboard</NavLink>
            <NavLink to="/profile" style={({ isActive }) => ({ color: isActive ? 'var(--text)' : undefined, background: isActive ? 'rgba(255,255,255,0.06)' : undefined })}>Profile</NavLink>
            <NavLink to="/admin" style={({ isActive }) => ({ color: isActive ? 'var(--text)' : undefined, background: isActive ? 'rgba(255,255,255,0.06)' : undefined })}>Admin</NavLink>
          </nav>
        </div>
      </header>
      <main className="container" style={{ flex: 1 }}>
        <Outlet />
      </main>
      <footer className="footer">© {new Date().getFullYear()} getPlacedFFS</footer>
    </div>
  )
}

export default App
