import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import Dashboard from './pages/Dashboard.tsx'
import Profile from './pages/Profile.tsx'
import Admin from './pages/Admin.tsx'
import Login from './pages/Login.tsx'
import AdminLogin from './pages/AdminLogin'
import SetupProfile from './pages/SetupProfile'
import PublicJobView from './pages/PublicJobView'
import AdminCreateJob from './pages/AdminCreateJob'
import AdminEditJob from './pages/AdminEditJob'
import { AuthProvider } from './lib/auth'
import RequireAuth from './lib/RequireAuth'
import EnsureProfile from './lib/EnsureProfile'
import { AdminAuthProvider } from './lib/adminAuth'
import RequireAdmin from './lib/RequireAdmin'
import ErrorBoundary from './ErrorBoundary'

if (import.meta.env.VITE_APP_NAME) {
  document.title = import.meta.env.VITE_APP_NAME
}

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/admin-login', element: <AdminLogin /> },
  { path: '/public/job/:jobId', element: <PublicJobView /> },
  { path: '/admin', element: <RequireAdmin />, children: [
    { index: true, element: <Admin /> },
    { path: 'create', element: <AdminCreateJob /> },
    { path: 'edit/:jobId', element: <AdminEditJob /> },
  ] },
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      { path: '/setup', element: <SetupProfile /> },
      {
        element: <EnsureProfile />,
        children: [
          {
            element: <App />,
            children: [
              { index: true, element: <Dashboard /> },
              { path: 'profile', element: <Profile /> }
            ],
          },
        ],
      },
    ],
  },
])

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AdminAuthProvider>
            <RouterProvider router={router} />
          </AdminAuthProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
