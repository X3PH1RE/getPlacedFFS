import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { listApplicationsWithProfiles } from '../lib/applications'
import { supabase } from '../lib/supabaseClient'

export default function PublicJobView() {
  const { jobId } = useParams()
  const [rows, setRows] = useState<any[]>([])
  const [job, setJob] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      if (!jobId) return
      try {
        const [{ data: jobData, error: jobErr }, appRows] = await Promise.all([
          supabase.from('jobs').select('*').eq('id', jobId).maybeSingle(),
          listApplicationsWithProfiles(jobId),
        ])
        if (jobErr) throw jobErr
        if (!active) return
        setJob(jobData)
        setRows(appRows)
      } catch (e: any) {
        setError(e.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [jobId])

  if (loading) return null

  return (
    <section className="section">
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="h1">{job ? `${job.company} — ${job.role}` : 'Applications'}</div>
        <div className="p">Live view of applicants for this job</div>
      </div>
      {error ? <div className="p" role="status">{error}</div> : null}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Name','Gender','Email','Contact','Department','Course','DOB','Home Town','Languages','10th %','12th/Diploma %','UG CGPA','PG CGPA','Backlogs','YOP'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={{ padding: 8 }}>{r.name}</td>
                <td style={{ padding: 8 }}>{r.gender}</td>
                <td style={{ padding: 8 }}>{r.email}</td>
                <td style={{ padding: 8 }}>{r.contact_no}</td>
                <td style={{ padding: 8 }}>{r.department}</td>
                <td style={{ padding: 8 }}>{r.course}</td>
                <td style={{ padding: 8 }}>{r.date_of_birth}</td>
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
            {rows.length === 0 ? (
              <tr><td className="p" style={{ padding: 8 }} colSpan={15}>No applicants yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="p" style={{ marginTop: 10 }}>
        <Link className="link" to="/">Back to app</Link>
      </div>
    </section>
  )
}
