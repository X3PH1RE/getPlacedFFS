import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SectionHeader from '../components/SectionHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import { deleteJob, listJobs, listJobFields, type Job, type JobField } from '../lib/jobs'
import { listApplicationsWithProfiles } from '../lib/applications'
import { formatDate, formatDateTime } from '../lib/date'
import { supabase } from '../lib/supabaseClient'
import { useAdminAuth } from '../lib/adminAuth'

type Student = {
  id: string
  student_no: string | null
  name: string
  gender: string
  email: string
  contact_no: string
  department: string
  course: string
  date_of_birth: string
  home_town: string
  languages_known: string
  tenth_percent: number | null
  twelfth_or_diploma_percent: number | null
  ug_cgpa: number | null
  pg_cgpa: number | null
  backlogs: number | null
  year_of_passing: number | null
  created_at: string
}

export default function Admin() {
  const { logout } = useAdminAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [status, setStatus] = useState<string | null>(null)
  const [applicantsByJob, setApplicantsByJob] = useState<Record<string, any[]>>({})
  const [loadingApplicants, setLoadingApplicants] = useState<Record<string, boolean>>({})
  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [activeTab, setActiveTab] = useState<'jobs' | 'students'>('jobs')
  const [deleteConfirm, setDeleteConfirm] = useState<{ jobId: string, company: string, role: string } | null>(null)
  const [deleteText, setDeleteText] = useState('')
  const subscriptionsRef = useRef<Record<string, ReturnType<typeof supabase.channel> | null>>({})
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
    return () => {
      act = false
      Object.values(subscriptionsRef.current).forEach((ch) => { if (ch) supabase.removeChannel(ch) })
      subscriptionsRef.current = {}
    }
  }, [])

  function handleDeleteClick(job: Job) {
    setDeleteConfirm({ jobId: job.id, company: job.company, role: job.role })
    setDeleteText('')
  }

  function handleDeleteCancel() {
    setDeleteConfirm(null)
    setDeleteText('')
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirm || deleteText !== 'delete') return
    
    try {
      await deleteJob(deleteConfirm.jobId)
      setJobs(prev => prev.filter(j => j.id !== deleteConfirm.jobId))
      setStatus(`Job "${deleteConfirm.company} — ${deleteConfirm.role}" deleted successfully`)
      setTimeout(() => setStatus(null), 3000)
    } catch (err: any) {
      setStatus(err.message || 'Failed to delete job')
    } finally {
      setDeleteConfirm(null)
      setDeleteText('')
    }
  }

  async function copyPublicLink(jobId: string) {
    const url = `${baseUrl}/public/job/${jobId}`
    try { await navigator.clipboard.writeText(url); setStatus('Public link copied') } catch { setStatus('Copy failed') }
    setTimeout(() => setStatus(null), 1200)
  }

  async function fetchApplicants(jobId: string) {
    setLoadingApplicants(prev => ({ ...prev, [jobId]: true }))
    try {
      const rows = await listApplicationsWithProfiles(jobId)
      setApplicantsByJob(prev => ({ ...prev, [jobId]: rows }))
    } finally {
      setLoadingApplicants(prev => ({ ...prev, [jobId]: false }))
    }
  }

  function ensureSubscribed(jobId: string) {
    if (subscriptionsRef.current[jobId]) return
    const channel = supabase
      .channel(`admin-applications-${jobId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'applications', filter: `job_id=eq.${jobId}` }, () => {
        // Refetch join to include profile data
        fetchApplicants(jobId)
      })
      .subscribe()
    subscriptionsRef.current[jobId] = channel
  }

  async function handleToggle(jobId: string) {
    const isOpen = !!expanded[jobId]
    const next = !isOpen
    setExpanded(prev => ({ ...prev, [jobId]: next }))
    if (next) {
      ensureSubscribed(jobId)
      await fetchApplicants(jobId)
    }
  }

  function formatExportRows(rows: any[], fields: JobField[]) {
    return rows.map(r => {
      const base: any = {
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
      }

      // Append dynamic job fields by label
      fields.forEach(f => {
        // Try to get from extra_fields JSON column first, then fallback to individual columns
        const extraFields = (r as any).extra_fields || {}
        const value = extraFields[f.key] ?? (r as any)[f.key] ?? ''
        base[f.label] = value
      })
      return base
    })
  }

  async function fetchStudents() {
    setLoadingStudents(true)
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setStudents(data as Student[])
    } catch (e: any) {
      setStatus(e.message || 'Failed to load students')
    } finally {
      setLoadingStudents(false)
    }
  }

  async function handleExport(job: Job) {
    try {
      await fetchApplicants(job.id)
      const raw = applicantsByJob[job.id] || []
      const fields: JobField[] = await listJobFields(job.id)
      const rows = formatExportRows(raw, fields)
      // @ts-ignore
      const XLSX = (await import('xlsx')).default || (await import('xlsx'))
      const dynamicHeaders = fields.map(f => f.label)
      const worksheet = XLSX.utils.json_to_sheet(rows, { header: [
        'No.','Name','Gender','Email','Contact No.','School/ Department','Course','Date of Birth','Home town','Languages known','10th %','12th/ Diploma %','UG CGPA','PG CGPA','Backlogs','Year of passing',
        ...dynamicHeaders
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

  async function handleExportAllStudents() {
    try {
      const rows = students.map(s => ({
        'No.': s.student_no ?? '',
        'Name': s.name ?? '',
        'Gender': s.gender ?? '',
        'Email': s.email ?? '',
        'Contact No.': s.contact_no ?? '',
        'School/ Department': s.department ?? '',
        'Course': s.course ?? '',
        'Date of Birth': formatDate(s.date_of_birth ?? ''),
        'Home town': s.home_town ?? '',
        'Languages known': s.languages_known ?? '',
        '10th %': s.tenth_percent ?? '',
        '12th/ Diploma %': s.twelfth_or_diploma_percent ?? '',
        'UG CGPA': s.ug_cgpa ?? '',
        'PG CGPA': s.pg_cgpa ?? '',
        'Backlogs': s.backlogs ?? '',
        'Year of passing': s.year_of_passing ?? '',
      }))
      // @ts-ignore
      const XLSX = (await import('xlsx')).default || (await import('xlsx'))
      const worksheet = XLSX.utils.json_to_sheet(rows, { header: [
        'No.','Name','Gender','Email','Contact No.','School/ Department','Course','Date of Birth','Home town','Languages known','10th %','12th/ Diploma %','UG CGPA','PG CGPA','Backlogs','Year of passing'
      ] })
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'All Students')
      const filename = `All_Students_IT27_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(workbook, filename)
    } catch (e: any) {
      setStatus(e.message || 'Export failed (install xlsx)')
      setTimeout(() => setStatus(null), 1500)
    }
  }

  return (
    <section className="section">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <SectionHeader title="Admin Dashboard" subtitle="Manage jobs and view all students" />
          <Button variant="ghost" onClick={() => logout()} style={{ alignSelf: 'flex-start', fontSize: '12px', padding: '6px 12px' }}>
            Sign out
          </Button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch' }}>
          <div className="tabs">
            <button 
              className={["tab", activeTab === 'jobs' ? 'tab-active' : ''].join(' ')} 
              onClick={() => setActiveTab('jobs')}
            >
              Jobs
            </button>
            <button 
              className={["tab", activeTab === 'students' ? 'tab-active' : ''].join(' ')} 
              onClick={() => {
                setActiveTab('students')
                if (students.length === 0) fetchStudents()
              }}
            >
              Students
            </button>
          </div>
          {activeTab === 'jobs' && (
            <Link to="/admin/create" className="link" style={{ alignSelf: 'flex-start', padding: '8px 12px', background: 'rgba(120,166,255,0.1)', borderRadius: '8px', border: '1px solid rgba(120,166,255,0.2)' }}>
              + New Job
            </Link>
          )}
        </div>
      </div>

      {status ? <div className="p" role="status">{status}</div> : null}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.8)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '400px', width: '100%', background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div className="h1" style={{ color: 'var(--danger)', marginBottom: '12px' }}>Delete Job</div>
            <div className="p" style={{ marginBottom: '16px' }}>
              Are you sure you want to delete <strong>"{deleteConfirm.company} — {deleteConfirm.role}"</strong>?
            </div>
            <div className="p" style={{ marginBottom: '16px', color: 'var(--muted)' }}>
              This action is irreversible and will permanently remove the job and all associated data.
            </div>
            <div className="field" style={{ marginBottom: '20px' }}>
              <span className="p">Type "delete" to confirm:</span>
              <input 
                className="input" 
                value={deleteText} 
                onChange={(e) => setDeleteText(e.target.value)} 
                placeholder="Type 'delete' here"
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={handleDeleteCancel}>Cancel</Button>
              <Button 
                onClick={handleDeleteConfirm} 
                disabled={deleteText !== 'delete'}
                style={{ 
                  background: deleteText === 'delete' ? 'var(--danger)' : 'var(--muted)',
                  color: 'white'
                }}
              >
                Delete Job
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'jobs' ? (
        loadingJobs ? null : (
          <div style={{ display: 'grid', gap: 12 }}>
            {jobs.map(j => {
              const isOpen = !!expanded[j.id]
              const applicants = applicantsByJob[j.id] || []
              const isLoading = !!loadingApplicants[j.id]
              return (
                <div key={j.id} className="card">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="h1" style={{ wordBreak: 'break-word' }}>{j.company} — {j.role}</div>
                        <div className="p">Deadline: {formatDate(j.deadline)} {j.min_ug_cgpa != null ? `• Min UG CGPA: ${j.min_ug_cgpa}` : ''}</div>
                      </div>
                      <Button variant="ghost" onClick={() => handleToggle(j.id)} style={{ flexShrink: 0, fontSize: '12px', padding: '6px 8px' }}>
                        {isOpen ? 'Collapse' : 'Expand'}
                      </Button>
                    </div>
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
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                        <Button variant="ghost" onClick={() => navigate(`/admin/create`)} disabled style={{ fontSize: '11px', padding: '6px 8px' }}>Duplicate</Button>
                        <Button variant="ghost" onClick={() => navigate(`/admin/edit/${j.id}`)} style={{ fontSize: '11px', padding: '6px 8px' }}>Edit</Button>
                        <Button variant="ghost" onClick={() => handleExport(j)} style={{ fontSize: '11px', padding: '6px 8px' }}>Export</Button>
                        <Button variant="ghost" onClick={() => copyPublicLink(j.id)} style={{ fontSize: '11px', padding: '6px 8px' }}>Copy Link</Button>
                        <Link className="link" to={`/public/job/${j.id}`} style={{ fontSize: '11px', padding: '6px 8px', textAlign: 'center', background: 'rgba(120,166,255,0.1)', borderRadius: '6px', border: '1px solid rgba(120,166,255,0.2)' }}>View</Link>
                        <Button variant="ghost" onClick={() => handleDeleteClick(j)} style={{ fontSize: '11px', padding: '6px 8px', color: 'var(--danger)' }}>Delete</Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
            {jobs.length === 0 ? <div className="p">No jobs yet.</div> : null}
          </div>
        )
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="p">Total Students: {loadingStudents ? 'Loading...' : students.length}</div>
            <Button variant="ghost" onClick={handleExportAllStudents} disabled={students.length === 0} style={{ alignSelf: 'flex-start', fontSize: '12px', padding: '8px 12px' }}>
              Export All Students
            </Button>
          </div>
          
          {loadingStudents ? (
            <div className="p">Loading students...</div>
          ) : students.length > 0 ? (
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
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td style={{ padding: 8 }}>{s.student_no ?? ''}</td>
                      <td style={{ padding: 8 }}>{s.name}</td>
                      <td style={{ padding: 8 }}>{s.gender}</td>
                      <td style={{ padding: 8 }}>{s.email}</td>
                      <td style={{ padding: 8 }}>{s.contact_no}</td>
                      <td style={{ padding: 8 }}>{s.department}</td>
                      <td style={{ padding: 8 }}>{s.course}</td>
                      <td style={{ padding: 8 }}>{formatDate(s.date_of_birth)}</td>
                      <td style={{ padding: 8 }}>{s.home_town}</td>
                      <td style={{ padding: 8 }}>{s.languages_known}</td>
                      <td style={{ padding: 8 }}>{s.tenth_percent ?? ''}</td>
                      <td style={{ padding: 8 }}>{s.twelfth_or_diploma_percent ?? ''}</td>
                      <td style={{ padding: 8 }}>{s.ug_cgpa ?? ''}</td>
                      <td style={{ padding: 8 }}>{s.pg_cgpa ?? ''}</td>
                      <td style={{ padding: 8 }}>{s.backlogs ?? ''}</td>
                      <td style={{ padding: 8 }}>{s.year_of_passing ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p">No students registered yet.</div>
          )}
        </div>
      )}
    </section>
  )
}
