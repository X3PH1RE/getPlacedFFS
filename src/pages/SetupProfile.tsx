import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SectionHeader from '../components/SectionHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import { useAuth } from '../lib/auth'
import { upsertProfile, getProfile } from '../lib/profile'

type StudentForm = {
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
}

export default function SetupProfile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const [form, setForm] = useState<StudentForm | null>(null)

  useEffect(() => {
    let act = true
    async function load() {
      if (!user) return
      try {
        const existing = await getProfile(user.id)
        if (!act) return
        const base: StudentForm = {
          id: user.id,
          student_no: existing?.student_no ?? null,
          name: existing?.name ?? '',
          gender: existing?.gender ?? '',
          email: existing?.email ?? (user.email ?? ''),
          contact_no: existing?.contact_no ?? '',
          department: existing?.department ?? '',
          course: existing?.course ?? '',
          date_of_birth: existing?.date_of_birth ?? '',
          home_town: existing?.home_town ?? '',
          languages_known: existing?.languages_known ?? '',
          tenth_percent: existing?.tenth_percent ?? null,
          twelfth_or_diploma_percent: existing?.twelfth_or_diploma_percent ?? null,
          ug_cgpa: existing?.ug_cgpa ?? null,
          pg_cgpa: existing?.pg_cgpa ?? null,
          backlogs: existing?.backlogs ?? null,
          year_of_passing: existing?.year_of_passing ?? null,
        }
        setForm(base)
      } catch (e) {
        // If no profile exists, create a new one with user email
        if (!act) return
        const base: StudentForm = {
          id: user.id,
          student_no: null,
          name: '',
          gender: '',
          email: user.email ?? '',
          contact_no: '',
          department: '',
          course: '',
          date_of_birth: '',
          home_town: '',
          languages_known: '',
          tenth_percent: null,
          twelfth_or_diploma_percent: null,
          ug_cgpa: null,
          pg_cgpa: null,
          backlogs: null,
          year_of_passing: null,
        }
        setForm(base)
      }
    }
    load()
    return () => { act = false }
  }, [user])

  function update<K extends keyof StudentForm>(key: K, value: StudentForm[K]) {
    if (!form) return
    setForm({ ...form, [key]: value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form || !user) return
    setLoading(true)
    setStatus(null)
    try {
      await upsertProfile(user.id, form as any)
      // Mark as completed to avoid immediate redirect race
      localStorage.setItem('profile-complete', '1')
      navigate('/', { replace: true })
    } catch (err: any) {
      setStatus(err.message || 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  if (!form) return null

  return (
    <section className="section">
      <SectionHeader title="Complete your profile" subtitle="Provide the required details to proceed" />
      <Card>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <div className="field">
            <span className="p">No. (Auto-generated)</span>
            <input className="input" value={form.student_no ?? ''} placeholder="Will be assigned automatically" disabled />
          </div>
          <div className="field">
            <span className="p">Name</span>
            <input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </div>
          <div className="field">
            <span className="p">Gender</span>
            <input className="input" value={form.gender} onChange={(e) => update('gender', e.target.value)} required />
          </div>
          <div className="field">
            <span className="p">Email</span>
            <input className="input" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
          </div>
          <div className="field">
            <span className="p">Contact No.</span>
            <input className="input" value={form.contact_no} onChange={(e) => update('contact_no', e.target.value)} required />
          </div>
          <div className="field">
            <span className="p">School / Department</span>
            <input className="input" value={form.department} onChange={(e) => update('department', e.target.value)} required />
          </div>
          <div className="field">
            <span className="p">Course</span>
            <input className="input" value={form.course} onChange={(e) => update('course', e.target.value)} required />
          </div>
          <div className="field">
            <span className="p">Date of Birth</span>
            <input className="input" type="date" value={form.date_of_birth} onChange={(e) => update('date_of_birth', e.target.value)} required />
          </div>
          <div className="field">
            <span className="p">Home Town</span>
            <input className="input" value={form.home_town} onChange={(e) => update('home_town', e.target.value)} required />
          </div>
          <div className="field">
            <span className="p">Languages Known</span>
            <input className="input" value={form.languages_known} onChange={(e) => update('languages_known', e.target.value)} required />
          </div>
          <div className="field">
            <span className="p">10th %</span>
            <input className="input" type="number" step="0.01" value={form.tenth_percent ?? ''} onChange={(e) => update('tenth_percent', e.target.value === '' ? null : Number(e.target.value))} required />
          </div>
          <div className="field">
            <span className="p">12th / Diploma %</span>
            <input className="input" type="number" step="0.01" value={form.twelfth_or_diploma_percent ?? ''} onChange={(e) => update('twelfth_or_diploma_percent', e.target.value === '' ? null : Number(e.target.value))} required />
          </div>
          <div className="field">
            <span className="p">UG CGPA</span>
            <input className="input" type="number" step="0.01" value={form.ug_cgpa ?? ''} onChange={(e) => update('ug_cgpa', e.target.value === '' ? null : Number(e.target.value))} required />
          </div>
          <div className="field">
            <span className="p">PG CGPA</span>
            <input className="input" type="number" step="0.01" value={form.pg_cgpa ?? ''} onChange={(e) => update('pg_cgpa', e.target.value === '' ? null : Number(e.target.value))} />
          </div>
          <div className="field">
            <span className="p">Backlogs</span>
            <input className="input" type="number" value={form.backlogs ?? ''} onChange={(e) => update('backlogs', e.target.value === '' ? null : Number(e.target.value))} required />
          </div>
          <div className="field">
            <span className="p">Year of Passing</span>
            <input className="input" type="number" value={form.year_of_passing ?? ''} onChange={(e) => update('year_of_passing', e.target.value === '' ? null : Number(e.target.value))} required />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end' }}>
            <Button disabled={loading} type="submit">{loading ? 'Saving...' : 'Save & Continue'}</Button>
            {status ? <span className="p" role="status">{status}</span> : null}
          </div>
        </form>
      </Card>
    </section>
  )
}
