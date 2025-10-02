import { useEffect, useState } from 'react'
import SectionHeader from '../components/SectionHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import { listJobs, type Job } from '../lib/jobs'
import { useAuth } from '../lib/auth'
import { applyToJob, listAppliedJobIds } from '../lib/applications'
import { Link } from 'react-router-dom'
import { formatDate } from '../lib/date'

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

  return (
    <section className="section">
      <SectionHeader title="Live Applications" subtitle="Jobs posted by admin will appear here." />
      {loading ? null : (
        <div style={{ display: 'grid', gap: 12 }}>
          {error ? <div className="p" role="status">{error}</div> : null}
          {jobs.map((j) => (
            <Card key={j.id}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{j.company} — {j.role}</div>
              <div className="p">Deadline: {formatDate(j.deadline)} {j.min_ug_cgpa != null ? `• Min UG CGPA: ${j.min_ug_cgpa}` : ''}</div>
              <div style={{ height: 12 }} />
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {applied.includes(j.id) ? (
                  <span className="p">You have applied</span>
                ) : (
                  <Button onClick={() => onApply(j.id)}>Apply</Button>
                )}
                <Link className="link" to={`/public/job/${j.id}`}>View applicants</Link>
              </div>
            </Card>
          ))}
          {jobs.length === 0 && !error ? <div className="p">No live jobs yet.</div> : null}
        </div>
      )}
    </section>
  )
}
