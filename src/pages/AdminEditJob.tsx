import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import SectionHeader from '../components/SectionHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import { getJob, updateJob } from '../lib/jobs'

export default function AdminEditJob() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [deadlineDate, setDeadlineDate] = useState('')
  const [deadlineTime, setDeadlineTime] = useState('')
  const [minCgpa, setMinCgpa] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    let act = true
    async function load() {
      if (!jobId) return
      try {
        const j = await getJob(jobId)
        if (!act || !j) return
        setCompany(j.company)
        setRole(j.role)
        const base = j.deadline_at ?? (j.deadline ? `${j.deadline}T23:59` : '')
        if (base) {
          const d = new Date(base)
          setDeadlineDate(d.toISOString().slice(0,10))
          setDeadlineTime(d.toTimeString().slice(0,5))
        }
        setMinCgpa(j.min_ug_cgpa != null ? String(j.min_ug_cgpa) : '')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { act = false }
  }, [jobId])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!jobId) return
    setSaving(true)
    setStatus(null)
    try {
      const localDateTime = `${deadlineDate}T${deadlineTime}`
      await updateJob(jobId, {
        company,
        role,
        deadline: deadlineDate,
        deadline_at: new Date(localDateTime).toISOString(),
        min_ug_cgpa: minCgpa === '' ? null : Number(minCgpa),
      })
      navigate('/admin', { replace: true })
    } catch (err: any) {
      setStatus(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <section className="section">
      <SectionHeader title="Edit job" />
      <Card>
        <form onSubmit={handleSave} style={{ display: 'grid', gap: 12 }}>
          <div className="field">
            <span className="p">Company</span>
            <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} required />
          </div>
          <div className="field">
            <span className="p">Role</span>
            <input className="input" value={role} onChange={(e) => setRole(e.target.value)} required />
          </div>
          <div className="field">
            <span className="p">Deadline date</span>
            <input className="input" type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} required />
          </div>
          <div className="field">
            <span className="p">Deadline time</span>
            <input className="input" type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} required />
          </div>
          <div className="field">
            <span className="p">Min UG CGPA (optional)</span>
            <input className="input" type="number" step="0.01" value={minCgpa} onChange={(e) => setMinCgpa(e.target.value)} />
          </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch' }}>
                    <Button disabled={saving} type="submit" style={{ alignSelf: 'flex-start' }}>{saving ? 'Saving...' : 'Save changes'}</Button>
                    {status ? <div className="p" role="status" style={{ textAlign: 'center', padding: '8px 12px', background: 'rgba(248,113,113,0.1)', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--danger)' }}>{status}</div> : null}
                  </div>
        </form>
      </Card>
    </section>
  )
}
