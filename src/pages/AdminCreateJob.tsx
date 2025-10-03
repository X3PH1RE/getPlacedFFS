import { useState } from 'react'
import SectionHeader from '../components/SectionHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import { createJobWithFields, type JobField } from '../lib/jobs'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../lib/adminAuth'

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-_]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function AdminCreateJob() {
  const { logout } = useAdminAuth()
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [deadlineDate, setDeadlineDate] = useState('')
  const [deadlineTime, setDeadlineTime] = useState('')
  const [minCgpa, setMinCgpa] = useState<string>('')
  const [fieldLabels, setFieldLabels] = useState<string[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function addField() { setFieldLabels(prev => [...prev, '']) }
  function updateField(idx: number, label: string) { setFieldLabels(prev => prev.map((v, i) => i === idx ? label : v)) }
  function removeField(idx: number) { setFieldLabels(prev => prev.filter((_, i) => i !== idx)) }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      const fieldsForApi: Array<Omit<JobField, 'id' | 'job_id'>> = fieldLabels
        .map(label => label.trim())
        .filter(Boolean)
        .map(label => ({ key: slugify(label), label, type: 'text', required: false }))

      const localDateTime = `${deadlineDate}T${deadlineTime}`
      await createJobWithFields({
        company,
        role,
        deadline: deadlineDate,
        deadline_at: new Date(localDateTime).toISOString(),
        min_ug_cgpa: minCgpa === '' ? null : Number(minCgpa),
      }, fieldsForApi)

      navigate('/admin', { replace: true })
    } catch (err: any) {
      setStatus(err.message || 'Failed to create job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <SectionHeader title="Create new job" subtitle="Add core details and optional extra fields" />
        <Button variant="ghost" onClick={() => logout()} style={{ alignSelf: 'flex-start', fontSize: '12px', padding: '6px 12px' }}>
          Sign out
        </Button>
      </div>
      <Card>
        <form onSubmit={handleCreate} style={{ display: 'grid', gap: 12 }}>
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

          <div className="divider" />
          <div className="h2">Extra fields to ask students (names only)</div>
          {fieldLabels.map((label, idx) => (
            <div key={idx} className="card" style={{ display: 'grid', gap: 10 }}>
              <div className="field">
                <span className="p">Field name</span>
                <input className="input" value={label} onChange={(e) => updateField(idx, e.target.value)} placeholder="e.g. Aadhaar number" />
              </div>
              <div className="p">Key preview: <code>{slugify(label) || '—'}</code></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="ghost" type="button" onClick={() => removeField(idx)}>Remove</Button>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch' }}>
            <Button type="button" variant="ghost" onClick={addField} style={{ alignSelf: 'flex-start' }}>+ Add field</Button>
            <Button disabled={loading} type="submit" style={{ alignSelf: 'flex-start' }}>{loading ? 'Creating...' : 'Create job'}</Button>
            {status ? <div className="p" role="status" style={{ textAlign: 'center', padding: '8px 12px', background: 'rgba(248,113,113,0.1)', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--danger)' }}>{status}</div> : null}
          </div>
        </form>
      </Card>
    </section>
  )
}
