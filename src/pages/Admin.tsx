import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SectionHeader from '../components/SectionHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import { deleteJob, listJobs, type Job } from '../lib/jobs'
import { listApplicationRows } from '../lib/applications'
import { formatDate } from '../lib/date'

export default function Admin() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [status, setStatus] = useState<string | null>(null)
  const [applicantsByJob, setApplicantsByJob] = useState<Record<string, any[]>>({})
  const [loadingApplicants, setLoadingApplicants] = useState<Record<string, boolean>>({})
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

  async function ensureApplicantsLoaded(jobId: string) {
    if (applicantsByJob[jobId] || loadingApplicants[jobId]) return
    setLoadingApplicants(prev => ({ ...prev, [jobId]: true }))
    try {
      const rows = await listApplicationRows(jobId)
      setApplicantsByJob(prev => ({ ...prev, [jobId]: rows }))
    } finally {
      setLoadingApplicants(prev => ({ ...prev, [jobId]: false }))
    }
  }

  async function handleToggle(jobId: string) {
    const isOpen = !!expanded[jobId]
    const next = !isOpen
    setExpanded(prev => ({ ...prev, [jobId]: next }))
    if (next) {
      await ensureApplicantsLoaded(jobId)
    }
  }

  function formatExportRows(rows: any[]) {
    return rows.map(r => ({
      'No.': r.student_no ?? '',
      'Name': r.name ?? '',
      'Gender': r.gender ?? '',
      'Email': r.email ?? '',
      'Contact No.': r.contact_no ?? '',
      'School/ Department': r.department ?? '',
      'Course': r.course ?? '',
      'Date of Birth': formatDate(r.date_of_birth ?? ''),
      'Home town': r.home_town ?? '',
      'Languages known': r.languages_known ?? '',
      '10th %': r.tenth_percent ?? '',
      '12th/ Diploma %': r.twelfth_or_diploma_percent ?? '',
      'UG CGPA': r.ug_cgpa ?? '',
      'PG CGPA': r.pg_cgpa ?? '',
      'Backlogs': r.backlogs ?? '',
      'Year of passing': r.year_of_passing ?? '',
    }))
  }

  async function handleExport(job: Job) {
    try {
      const raw = applicantsByJob[job.id] || await listApplicationRows(job.id)
      const rows = formatExportRows(raw)
      // dynamic import to avoid bundling error if xlsx missing
      // @ts-ignore
      const XLSX = (await import('xlsx')).default || (await import('xlsx'))
      const worksheet = XLSX.utils.json_to_sheet(rows, { header: [
        'No.','Name','Gender','Email','Contact No.','School/ Department','Course','Date of Birth','Home town','Languages known','10th %','12th/ Diploma %','UG CGPA','PG CGPA','Backlogs','Year of passing'
      ] })
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
            const applicants = applicantsByJob[j.id] || []
            const isLoading = !!loadingApplicants[j.id]
            return (
              <div key={j.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div className="h1">{j.company} — {j.role}</div>
                    <div className="p">Deadline: {formatDate(j.deadline)} {j.min_ug_cgpa != null ? `• Min UG CGPA: ${j.min_ug_cgpa}` : ''}</div>
                  </div>
                  <Button variant="ghost" onClick={() => handleToggle(j.id)}>{isOpen ? 'Collapse' : 'Expand'}</Button>
                </div>
                {isOpen ? (
                  <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                    <div className="p">Applicants: {isLoading ? 'Loading...' : applicants.length}</div>
                    {!isLoading && applicants.length > 0 ? (
                      <div className="card" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              {['No.','Name','Gender','Email','Contact No.','School/ Department','Course','Date of Birth','Home town','Languages known','10th %','12th/ Diploma %','UG CGPA','PG CGPA','Backlogs','Year of passing'].map((h) => (
                                <th key={h} style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {applicants.map((r: any) => (
                              <tr key={r.id}>
                                <td style={{ padding: 8 }}>{r.student_no ?? ''}</td>
                                <td style={{ padding: 8 }}>{r.name}</td>
                                <td style={{ padding: 8 }}>{r.gender}</td>
                                <td style={{ padding: 8 }}>{r.email}</td>
                                <td style={{ padding: 8 }}>{r.contact_no}</td>
                                <td style={{ padding: 8 }}>{r.department}</td>
                                <td style={{ padding: 8 }}>{r.course}</td>
                                <td style={{ padding: 8 }}>{formatDate(r.date_of_birth)}</td>
                                <td style={{ padding: 8 }}>{r.home_town}</td>
                                <td style={{ padding: 8 }}>{r.languages_known}</td>
                                <td style={{ padding: 8 }}>{r.tenth_percent ?? ''}</td>
                                <td style={{ padding: 8 }}>{r.twelfth_or_diploma_percent ?? ''}</td>
                                <td style={{ padding: 8 }}>{r.ug_cgpa ?? ''}</td>
                                <td style={{ padding: 8 }}>{r.pg_cgpa ?? ''}</td>
                                <td style={{ padding: 8 }}>{r.backlogs ?? ''}</td>
                                <td style={{ padding: 8 }}>{r.year_of_passing ?? ''}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
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
