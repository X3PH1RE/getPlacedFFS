import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import SectionHeader from '../components/SectionHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import { getJob, updateJob, listJobFields, type JobField } from '../lib/jobs'
import { useAdminAuth } from '../lib/adminAuth'
import { supabase } from '../lib/supabaseClient'

export default function AdminEditJob() {
  const { logout } = useAdminAuth()
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [deadlineDate, setDeadlineDate] = useState('')
  const [deadlineTime, setDeadlineTime] = useState('')
  const [minCgpa, setMinCgpa] = useState<string>('')
  const [applyMode, setApplyMode] = useState<'sheet' | 'link'>('sheet')
  const [applyLink, setApplyLink] = useState<string>('')
  const [fieldLabels, setFieldLabels] = useState<string[]>([])
  const [fieldRequired, setFieldRequired] = useState<boolean[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    let act = true
    async function load() {
      if (!jobId) return
      try {
        const [j, fields] = await Promise.all([
          getJob(jobId),
          listJobFields(jobId)
        ])
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
        setApplyMode((j as any).apply_mode ?? 'sheet')
        setApplyLink((j as any).apply_link ?? '')
        setFieldLabels(fields.map(f => f.label))
        setFieldRequired(fields.map(f => f.required))
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { act = false }
  }, [jobId])

  function addField() { 
    setFieldLabels(prev => [...prev, ''])
    setFieldRequired(prev => [...prev, false])
  }
  function updateField(idx: number, label: string) { setFieldLabels(prev => prev.map((v, i) => i === idx ? label : v)) }
  function updateRequired(idx: number, required: boolean) { setFieldRequired(prev => prev.map((v, i) => i === idx ? required : v)) }
  function removeField(idx: number) { 
    setFieldLabels(prev => prev.filter((_, i) => i !== idx))
    setFieldRequired(prev => prev.filter((_, i) => i !== idx))
  }

  function slugify(input: string) {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-_]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

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
        apply_mode: applyMode,
        apply_link: applyMode === 'link' ? (applyLink.trim() || null) : null,
      })

      // Update job fields
      const fieldsForApi: Array<Omit<JobField, 'id' | 'job_id'>> = fieldLabels
        .map((label, idx) => ({ label: label.trim(), required: fieldRequired[idx] || false }))
        .filter(f => f.label)
        .map(f => ({ key: slugify(f.label), label: f.label, type: 'text', required: f.required }))

      // Delete existing fields and insert new ones
      await supabase.from('job_fields').delete().eq('job_id', jobId)
      if (fieldsForApi.length > 0) {
        await supabase.from('job_fields').insert(fieldsForApi.map(f => ({
          job_id: jobId,
          key: f.key,
          label: f.label,
          type: f.type,
          required: f.required,
        })))
      }

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <SectionHeader title="Edit job" />
        <Button variant="ghost" onClick={() => logout()} style={{ alignSelf: 'flex-start', fontSize: '12px', padding: '6px 12px' }}>
          Sign out
        </Button>
      </div>
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
          <div className="divider" />
          <div className="h2">Application mode</div>
          <div className="field">
            <span className="p">Apply mode</span>
            <select className="input" value={applyMode} onChange={(e) => setApplyMode((e.target.value as 'sheet' | 'link'))}>
              <option value="sheet">Sheet (collect applications here)</option>
              <option value="link">External link (redirect on apply)</option>
            </select>
          </div>
          {applyMode === 'link' ? (
            <div className="field">
              <span className="p">Apply link</span>
              <input className="input" type="url" placeholder="https://example.com/apply" value={applyLink} onChange={(e) => setApplyLink(e.target.value)} required={applyMode === 'link'} pattern="https?://.*" title="Enter a valid URL starting with http:// or https://" />
            </div>
          ) : null}

          <div className="divider" />
          <div className="h2">Extra fields to ask students (names only)</div>
          {fieldLabels.map((label, idx) => (
            <div key={idx} className="card" style={{ display: 'grid', gap: 10 }}>
              <div className="field">
                <span className="p">Field name</span>
                <input className="input" value={label} onChange={(e) => updateField(idx, e.target.value)} placeholder="e.g. Aadhaar number" />
              </div>
              <div className="field">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input 
                    type="checkbox" 
                    checked={fieldRequired[idx] || false} 
                    onChange={(e) => updateRequired(idx, e.target.checked)} 
                  />
                  <span className="p">Required field</span>
                </label>
              </div>
              <div className="p">Key preview: <code>{slugify(label) || '—'}</code></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="ghost" type="button" onClick={() => removeField(idx)}>Remove</Button>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch' }}>
            <Button type="button" variant="ghost" onClick={addField} style={{ alignSelf: 'flex-start' }}>+ Add field</Button>
            <Button disabled={saving} type="submit" style={{ alignSelf: 'flex-start' }}>{saving ? 'Saving...' : 'Save changes'}</Button>
            {status ? <div className="p" role="status" style={{ textAlign: 'center', padding: '8px 12px', background: 'rgba(248,113,113,0.1)', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--danger)' }}>{status}</div> : null}
          </div>
        </form>
      </Card>
    </section>
  )
}
