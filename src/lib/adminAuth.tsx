import { createContext, useContext, useMemo, useState } from 'react'

export type AdminAuthValue = {
  isAdmin: boolean
  login: (id: string, password: string) => Promise<boolean>
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthValue | undefined>(undefined)

const ADMIN_ID = 'ashwinadmin'
const ADMIN_PASS = 'novacrat502'
const LS_KEY = 'admin-auth'

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem(LS_KEY) === '1')

  async function login(id: string, password: string) {
    const ok = id === ADMIN_ID && password === ADMIN_PASS
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
