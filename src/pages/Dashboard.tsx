import { useEffect, useState } from 'react'
import SectionHeader from '../components/SectionHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import { listJobs, type Job, type JobField } from '../lib/jobs'
import { useAuth } from '../lib/auth'
import { applyToJob, listAppliedJobIds } from '../lib/applications'
import { Link } from 'react-router-dom'
import { formatDate, formatDateTime } from '../lib/date'
import { getProfile, type StudentProfile } from '../lib/profile'

export default function Dashboard() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [applied, setApplied] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [applyErrorByJob, setApplyErrorByJob] = useState<Record<string, string>>({})
  const [fieldsByJob, setFieldsByJob] = useState<Record<string, JobField[]>>({})
  const [answersByJob, setAnswersByJob] = useState<Record<string, Record<string, any>>>({})
  const [showFieldsModal, setShowFieldsModal] = useState<Job | null>(null)

  useEffect(() => {
    let act = true
    async function load() {
      try {
        const [jobsData, appliedIds, prof] = await Promise.all([
          listJobs(),
          user ? listAppliedJobIds(user.id) : Promise.resolve([]),
          user ? getProfile(user.id) : Promise.resolve(null),
        ])
        if (!act) return
        setJobs(jobsData)
        setApplied(appliedIds)
        setProfile(prof)

        // Prefetch all job fields for these jobs in one query
        const jobIds = jobsData.map(j => j.id)
        if (jobIds.length > 0) {
          try {
            const { supabase } = await import('../lib/supabaseClient')
            const { data, error } = await supabase
              .from('job_fields')
              .select('*')
              .in('job_id', jobIds)
            if (!error && data) {
              const byJob: Record<string, JobField[]> = {}
              ;(data as any[]).forEach((f: any) => {
                if (!byJob[f.job_id]) byJob[f.job_id] = []
                byJob[f.job_id].push(f as JobField)
              })
              setFieldsByJob(byJob)
            }
          } catch {}
        }
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
      setApplyErrorByJob(prev => ({ ...prev, [jobId]: '' }))
    } catch (e: any) {
      const msg = e?.message || "Couldn't apply"
      setApplyErrorByJob(prev => ({ ...prev, [jobId]: msg }))
    }
  }

  function setJobAnswer(jobId: string, key: string, value: any) {
    setAnswersByJob(prev => ({ ...prev, [jobId]: { ...(prev[jobId] || {}), [key]: value } }))
  }

  async function submitWithFields() {
    if (!showFieldsModal || !user) return
    
    const fields = fieldsByJob[showFieldsModal.id] || []
    const answers = answersByJob[showFieldsModal.id] || {}
    
    // Check if all required fields are filled
    const missingRequired = fields.filter(f => f.required && (!answers[f.key] || answers[f.key] === ''))
    
    if (missingRequired.length > 0) {
      setApplyErrorByJob(prev => ({ 
        ...prev, 
        [showFieldsModal.id]: `Please fill required fields: ${missingRequired.map(f => f.label).join(', ')}` 
      }))
      return
    }
    
    try {
      await applyToJob(showFieldsModal.id, user.id, answers)
      setApplied(prev => [...prev, showFieldsModal.id])
      setApplyErrorByJob(prev => ({ ...prev, [showFieldsModal.id]: '' }))
      setShowFieldsModal(null)
    } catch (e: any) {
      setApplyErrorByJob(prev => ({ ...prev, [showFieldsModal.id]: e?.message || "Couldn't apply" }))
    }
  }

  const now = new Date()
  const live = jobs.filter(j => {
    const base = j.deadline_at ?? (j.deadline ? `${j.deadline}T23:59` : '')
    if (!base) return true
    const cutoff = new Date(base)
    return cutoff.getTime() > now.getTime()
  })
  const past = jobs.filter(j => !live.includes(j))

  // Determine if profile is incomplete (required fields missing)
  const profileIncomplete = !profile || [
    profile.name,
    profile.gender,
    profile.email,
    profile.contact_no,
    profile.department,
    profile.course,
    profile.date_of_birth,
    profile.home_town,
    profile.languages_known,
    profile.tenth_percent,
    profile.twelfth_or_diploma_percent,
    profile.ug_cgpa,
    profile.backlogs,
    profile.year_of_passing,
  ].some(v => v == null || (typeof v === 'string' && v.trim() === ''))

  return (
    <section className="section">
      <SectionHeader title="Live Applications" subtitle="Jobs posted by admin will appear here." />
      {loading ? null : (
        <div style={{ display: 'grid', gap: 12 }}>
          {error ? <div className="p" role="status">{error}</div> : null}
          {live.map((j) => (
            <Card key={j.id}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4, wordBreak: 'break-word' }}>{j.company} — {j.role}</div>
                  <div className="p">Deadline: {j.deadline_at ? formatDateTime(j.deadline_at) : `${formatDate(j.deadline)} 23:59`} {j.min_ug_cgpa != null ? `• Min UG CGPA: ${j.min_ug_cgpa}` : ''}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {applied.includes(j.id) ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(110,231,183,0.1)', borderRadius: '8px', border: '1px solid rgba(110,231,183,0.2)' }}>
                      <span style={{ color: 'var(--success)', fontSize: '14px', fontWeight: '600' }}>✓ You have applied</span>
                    </div>
                  ) : (
                    <>
                      {j.apply_mode === 'link' && j.apply_link ? (
                        <a
                          href={/^https?:\/\//i.test(j.apply_link) ? j.apply_link : `https://${j.apply_link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn"
                          style={{ alignSelf: 'flex-start' }}
                        >
                          Apply
                        </a>
                      ) : (
                        <>
                          <Button
                            onClick={async () => {
                              const fields = fieldsByJob[j.id] || []
                              if (fields.length > 0) {
                                // Show modal to fill fields
                                setShowFieldsModal(j)
                                return
                              }
                              // Fallback: attempt fetch in case fields weren't preloaded
                              try {
                                const { data } = await (await import('../lib/supabaseClient')).supabase
                                  .from('job_fields')
                                  .select('id, key, label, type, required')
                                  .eq('job_id', j.id)
                                const fetched = (data as any[] || []) as JobField[]
                                if (fetched.length > 0) {
                                  setFieldsByJob(prev => ({ ...prev, [j.id]: fetched }))
                                  setShowFieldsModal(j)
                                  return
                                }
                              } catch {}
                              onApply(j.id)
                            }}
                            style={{ alignSelf: 'flex-start' }}
                            disabled={
                              profileIncomplete ||
                              (j.min_ug_cgpa != null && (profile?.ug_cgpa == null || (profile?.ug_cgpa ?? 0) < j.min_ug_cgpa))
                            }
                            title={
                              profileIncomplete
                                ? 'Complete your profile to apply'
                                : (j.min_ug_cgpa != null && (profile?.ug_cgpa == null || (profile?.ug_cgpa ?? 0) < j.min_ug_cgpa))
                                  ? "You can't apply because of your CGPA"
                                  : undefined
                            }
                          >
                            Apply
                          </Button>
                          
                          {profileIncomplete ? (
                            <div className="p" role="status" style={{ color: 'var(--danger)' }}>Complete your profile to apply</div>
                          ) : null}
                          {j.min_ug_cgpa != null && (profile?.ug_cgpa == null || (profile?.ug_cgpa ?? 0) < j.min_ug_cgpa) && !profileIncomplete ? (
                            <div className="p" role="status" style={{ color: 'var(--danger)' }}>You can't apply because of your CGPA</div>
                          ) : null}
                        </>
                      )}
                      {applyErrorByJob[j.id] ? (
                        <div className="p" role="status" style={{ color: 'var(--danger)' }}>{applyErrorByJob[j.id]}</div>
                      ) : null}
                    </>
                  )}
                  <Link className="link" to={`/public/job/${j.id}`} style={{ alignSelf: 'flex-start', padding: '8px 12px', background: 'rgba(120,166,255,0.1)', borderRadius: '8px', border: '1px solid rgba(120,166,255,0.2)' }}>
                    View applicants
                  </Link>
                </div>
              </div>
            </Card>
          ))}
          {live.length === 0 && !error ? <div className="p">No live jobs yet.</div> : null}

  {live.map((j) => (
    (fieldsByJob[j.id] && fieldsByJob[j.id].length > 0) ? (
      <Card key={`${j.id}-extras`}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ fontWeight: 700 }}>Additional details for {j.company} — {j.role}</div>
          {fieldsByJob[j.id].map(f => (
            <div key={f.id} className="field">
              <span className="p">{f.label}{f.required ? ' *' : ''}</span>
              {f.type === 'number' ? (
                <input 
                  className="input" 
                  type="number" 
                  value={(answersByJob[j.id]?.[f.key] ?? '') as any} 
                  onChange={(e) => setJobAnswer(j.id, f.key, e.target.value === '' ? '' : Number(e.target.value))} 
                  required={f.required}
                />
              ) : f.type === 'date' ? (
                <input 
                  className="input" 
                  type="date" 
                  value={(answersByJob[j.id]?.[f.key] ?? '') as any} 
                  onChange={(e) => setJobAnswer(j.id, f.key, e.target.value)} 
                  required={f.required}
                />
              ) : (
                <input 
                  className="input" 
                  value={(answersByJob[j.id]?.[f.key] ?? '') as any} 
                  onChange={(e) => setJobAnswer(j.id, f.key, e.target.value)} 
                  required={f.required}
                />
              )}
            </div>
          ))}
          <div className="p">These details will be submitted when you click Apply.</div>
        </div>
      </Card>
    ) : null
  ))}

          <div className="divider" />
          <SectionHeader title="Past Applications" subtitle="Closed applications" />
          {past.map((j) => (
            <Card key={j.id}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4, wordBreak: 'break-word' }}>{j.company} — {j.role}</div>
                  <div className="p">Closed: {j.deadline_at ? formatDateTime(j.deadline_at) : `${formatDate(j.deadline)} 23:59`}</div>
                </div>
                <div>
                  <Link className="link" to={`/public/job/${j.id}`} style={{ alignSelf: 'flex-start', padding: '8px 12px', background: 'rgba(120,166,255,0.1)', borderRadius: '8px', border: '1px solid rgba(120,166,255,0.2)' }}>
                    View applicants
                  </Link>
                </div>
              </div>
            </Card>
          ))}
          {past.length === 0 ? <div className="p">No past jobs.</div> : null}
        </div>
      )}

      {/* Additional Fields Modal */}
      {showFieldsModal ? (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ maxWidth: '500px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <Card>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ fontWeight: 700, fontSize: '18px' }}>
                Additional Details for {showFieldsModal.company} — {showFieldsModal.role}
              </div>
              <div className="p">Please fill out the following information to complete your application:</div>
              
              {fieldsByJob[showFieldsModal.id]?.map(f => (
                <div key={f.id} className="field">
                  <span className="p">{f.label}{f.required ? ' *' : ''}</span>
                  {f.type === 'number' ? (
                    <input 
                      className="input" 
                      type="number" 
                      value={(answersByJob[showFieldsModal.id]?.[f.key] ?? '') as any} 
                      onChange={(e) => setJobAnswer(showFieldsModal.id, f.key, e.target.value === '' ? '' : Number(e.target.value))} 
                      required={f.required}
                    />
                  ) : f.type === 'date' ? (
                    <input 
                      className="input" 
                      type="date" 
                      value={(answersByJob[showFieldsModal.id]?.[f.key] ?? '') as any} 
                      onChange={(e) => setJobAnswer(showFieldsModal.id, f.key, e.target.value)} 
                      required={f.required}
                    />
                  ) : (
                    <input 
                      className="input" 
                      value={(answersByJob[showFieldsModal.id]?.[f.key] ?? '') as any} 
                      onChange={(e) => setJobAnswer(showFieldsModal.id, f.key, e.target.value)} 
                      required={f.required}
                    />
                  )}
                </div>
              ))}
              
              {applyErrorByJob[showFieldsModal.id] ? (
                <div className="p" role="status" style={{ color: 'var(--danger)' }}>
                  {applyErrorByJob[showFieldsModal.id]}
                </div>
              ) : null}
              
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button variant="ghost" onClick={() => setShowFieldsModal(null)}>
                  Cancel
                </Button>
                <Button onClick={submitWithFields}>
                  Submit Application
                </Button>
              </div>
            </div>
            </Card>
          </div>
        </div>
      ) : null}
    </section>
  )
}
