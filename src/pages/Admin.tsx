import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SectionHeader from '../components/SectionHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import { deleteJob, listJobs, type Job } from '../lib/jobs'
import { listApplicationsWithProfiles } from '../lib/applications'

export default function Admin() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [status, setStatus] = useState<string | null>(null)
  const navigate = useNavigate()

  const baseUrl = useMemo(() => window.location.origin, [])

  useEffect(() => {
    let act = true
    async function load() {
      try {
        const data = await listJobs()
        if (!act) return
        setJobs(data)
      } finally {
        setLoadingJobs(false)
      }
    }
    load()
    return () => { act = false }
  }, [])

  async function handleDelete(jobId: string) {
    await deleteJob(jobId)
    setJobs(prev => prev.filter(j => j.id !== jobId))
  }

  async function copyPublicLink(jobId: string) {
    const url = `${baseUrl}/public/job/${jobId}`
    try { await navigator.clipboard.writeText(url); setStatus('Public link copied') } catch { setStatus('Copy failed') }
    setTimeout(() => setStatus(null), 1200)
  }

  async function handleExport(job: Job) {
    try {
      const rows = await listApplicationsWithProfiles(job.id)
      // dynamic import to avoid bundling error if xlsx missing
      // @ts-ignore
      const XLSX = (await import('xlsx')).default || (await import('xlsx'))
      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Applicants')
      const filename = `${job.company}_IT27_student list`.replaceAll(' ', '_') + '.xlsx'
      XLSX.writeFile(workbook, filename)
    } catch (e: any) {
      setStatus(e.message || 'Export failed (install xlsx)')
      setTimeout(() => setStatus(null), 1500)
    }
  }

  return (
    <section className="section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionHeader title="Admin — Jobs" subtitle="View and manage existing jobs" />
        <Link to="/admin/create" className="link">+ New Job</Link>
      </div>

      {status ? <div className="p" role="status">{status}</div> : null}

      {loadingJobs ? null : (
        <div style={{ display: 'grid', gap: 12 }}>
          {jobs.map(j => {
            const isOpen = !!expanded[j.id]
            return (
              <div key={j.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div className="h1">{j.company} — {j.role}</div>
                    <div className="p">Deadline: {j.deadline} {j.min_ug_cgpa != null ? `• Min UG CGPA: ${j.min_ug_cgpa}` : ''}</div>
                  </div>
                  <Button variant="ghost" onClick={() => setExpanded(prev => ({ ...prev, [j.id]: !isOpen }))}>{isOpen ? 'Collapse' : 'Expand'}</Button>
                </div>
                {isOpen ? (
                  <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Button variant="ghost" onClick={() => navigate(`/admin/create`)} disabled>Duplicate (coming soon)</Button>
                      <Button variant="ghost" onClick={() => navigate(`/admin/edit/${j.id}`)}>Edit</Button>
                      <Button variant="ghost" onClick={() => handleExport(j)}>Export XLSX</Button>
                      <Button variant="ghost" onClick={() => copyPublicLink(j.id)}>Copy public link</Button>
                      <Link className="link" to={`/public/job/${j.id}`}>Open public view</Link>
                      <Button variant="ghost" onClick={() => handleDelete(j.id)}>Delete</Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
          {jobs.length === 0 ? <div className="p">No jobs yet.</div> : null}
        </div>
      )}
    </section>
  )
}
