import { Component } from 'react'
import type { ReactNode } from 'react'

type Props = { children: ReactNode }

type State = { hasError: boolean; error?: any }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('App error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 720 }}>
            <div className="h1" style={{ marginBottom: 8 }}>Something went wrong</div>
            <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--muted)' }}>
              {String(this.state.error?.message || this.state.error || 'Unknown error')}
            </pre>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
