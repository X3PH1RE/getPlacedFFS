import { createContext, useContext, useMemo, useState } from 'react'

export type AdminAuthValue = {
  isAdmin: boolean
  login: (id: string, password: string) => Promise<boolean>
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthValue | undefined>(undefined)

// Support multiple admins via environment variables
const ADMIN_CREDENTIALS = [
  {
    id: import.meta.env.VITE_ADMIN_ID || 'ashwinadmin',
    password: import.meta.env.VITE_ADMIN_PASSWORD || 'novacrat502'
  },
  {
    id: import.meta.env.VITE_ADMIN_ID_2 || '',
    password: import.meta.env.VITE_ADMIN_PASSWORD_2 || ''
  }
].filter(admin => admin.id && admin.password) // Only include admins with both ID and password
const LS_KEY = 'admin-auth'

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem(LS_KEY) === '1')

  async function login(id: string, password: string) {
    const ok = ADMIN_CREDENTIALS.some(admin => admin.id === id && admin.password === password)
    if (ok) {
      setIsAdmin(true)
      localStorage.setItem(LS_KEY, '1')
    }
    return ok
  }

  function logout() {
    setIsAdmin(false)
    localStorage.removeItem(LS_KEY)
  }

  const value = useMemo<AdminAuthValue>(() => ({ isAdmin, login, logout }), [isAdmin])
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
