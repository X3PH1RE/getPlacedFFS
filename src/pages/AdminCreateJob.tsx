import { useState } from 'react'
import SectionHeader from '../components/SectionHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import { createJobWithFields, type JobField } from '../lib/jobs'
import { useNavigate } from 'react-router-dom'

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-_]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function AdminCreateJob() {
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [deadline, setDeadline] = useState('')
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

      await createJobWithFields({
        company,
        role,
        deadline,
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
      <SectionHeader title="Create new job" subtitle="Add core details and optional extra fields" />
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
            <span className="p">Deadline</span>
            <input className="input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
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
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Button type="button" variant="ghost" onClick={addField}>+ Add field</Button>
            <Button disabled={loading} type="submit">{loading ? 'Creating...' : 'Create job'}</Button>
            {status ? <span className="p" role="status">{status}</span> : null}
          </div>
        </form>
      </Card>
    </section>
  )
}
