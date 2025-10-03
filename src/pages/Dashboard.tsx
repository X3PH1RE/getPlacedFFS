import { useEffect, useState } from 'react'
import SectionHeader from '../components/SectionHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import { listJobs, type Job } from '../lib/jobs'
import { useAuth } from '../lib/auth'
import { applyToJob, listAppliedJobIds } from '../lib/applications'
import { Link } from 'react-router-dom'
import { formatDate, formatDateTime } from '../lib/date'

export default function Dashboard() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [applied, setApplied] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let act = true
    async function load() {
      try {
        const [jobsData, appliedIds] = await Promise.all([
          listJobs(),
          user ? listAppliedJobIds(user.id) : Promise.resolve([]),
        ])
        if (!act) return
        setJobs(jobsData)
        setApplied(appliedIds)
      } catch (e: any) {
        setError(e.message || 'Failed to load jobs')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { act = false }
  }, [user])

  async function onApply(jobId: string) {
    if (!user) return
    try {
      await applyToJob(jobId, user.id)
      setApplied(prev => [...prev, jobId])
    } catch (e) {
      // ignore
    }
  }

  const now = new Date()
  const live = jobs.filter(j => {
    const base = j.deadline_at ?? (j.deadline ? `${j.deadline}T23:59` : '')
    if (!base) return true
    const cutoff = new Date(base)
    return cutoff.getTime() > now.getTime()
  })
  const past = jobs.filter(j => !live.includes(j))

  return (
    <section className="section">
      <SectionHeader title="Live Applications" subtitle="Jobs posted by admin will appear here." />
      {loading ? null : (
        <div style={{ display: 'grid', gap: 12 }}>
          {error ? <div className="p" role="status">{error}</div> : null}
          {live.map((j) => (
            <Card key={j.id}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4, wordBreak: 'break-word' }}>{j.company} — {j.role}</div>
                  <div className="p">Deadline: {j.deadline_at ? formatDateTime(j.deadline_at) : `${formatDate(j.deadline)} 23:59`} {j.min_ug_cgpa != null ? `• Min UG CGPA: ${j.min_ug_cgpa}` : ''}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {applied.includes(j.id) ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(110,231,183,0.1)', borderRadius: '8px', border: '1px solid rgba(110,231,183,0.2)' }}>
                      <span style={{ color: 'var(--success)', fontSize: '14px', fontWeight: '600' }}>✓ You have applied</span>
                    </div>
                  ) : (
                    <Button onClick={() => onApply(j.id)} style={{ alignSelf: 'flex-start' }}>Apply</Button>
                  )}
                  <Link className="link" to={`/public/job/${j.id}`} style={{ alignSelf: 'flex-start', padding: '8px 12px', background: 'rgba(120,166,255,0.1)', borderRadius: '8px', border: '1px solid rgba(120,166,255,0.2)' }}>
                    View applicants
                  </Link>
                </div>
              </div>
            </Card>
          ))}
          {live.length === 0 && !error ? <div className="p">No live jobs yet.</div> : null}

          <div className="divider" />
          <SectionHeader title="Past Applications" subtitle="Closed applications" />
          {past.map((j) => (
            <Card key={j.id}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4, wordBreak: 'break-word' }}>{j.company} — {j.role}</div>
                  <div className="p">Closed: {j.deadline_at ? formatDateTime(j.deadline_at) : `${formatDate(j.deadline)} 23:59`}</div>
                </div>
                <div>
                  <Link className="link" to={`/public/job/${j.id}`} style={{ alignSelf: 'flex-start', padding: '8px 12px', background: 'rgba(120,166,255,0.1)', borderRadius: '8px', border: '1px solid rgba(120,166,255,0.2)' }}>
                    View applicants
                  </Link>
                </div>
              </div>
            </Card>
          ))}
          {past.length === 0 ? <div className="p">No past jobs.</div> : null}
        </div>
      )}
    </section>
  )
}
