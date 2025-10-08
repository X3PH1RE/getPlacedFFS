import { supabase } from './supabaseClient'

export type Job = {
  id: string
  company: string
  role: string
  deadline: string // ISO date (yyyy-mm-dd)
  deadline_at?: string | null // full ISO timestamp (required in UI)
  min_ug_cgpa: number | null
  apply_mode?: 'sheet' | 'link' | null
  apply_link?: string | null
  created_at?: string
}

export type JobField = {
  id: string
  job_id: string
  key: string
  label: string
  type: 'text' | 'number' | 'date'
  required: boolean
}

export async function listJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Job[]
}

export async function getJob(jobId: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle()
  if (error) throw error
  return data as Job | null
}

export async function updateJob(jobId: string, patch: Partial<Job>): Promise<Job> {
  const { data, error } = await supabase
    .from('jobs')
    .update(patch)
    .eq('id', jobId)
    .select('*')
    .single()
  if (error) throw error
  return data as Job
}

export async function deleteJob(jobId: string): Promise<void> {
  const { error } = await supabase.from('jobs').delete().eq('id', jobId)
  if (error) throw error
}

export async function createJobWithFields(job: Omit<Job, 'id' | 'created_at'>, fields: Array<Omit<JobField, 'id' | 'job_id'>>): Promise<{ job: Job, fields: JobField[] }> {
  const { data: jobRow, error: jobErr } = await supabase
    .from('jobs')
    .insert({
      company: job.company,
      role: job.role,
      deadline: job.deadline,
      deadline_at: job.deadline_at ?? null,
      min_ug_cgpa: job.min_ug_cgpa ?? null,
      apply_mode: (job as any).apply_mode ?? 'sheet',
      apply_link: (job as any).apply_link ?? null,
    })
    .select('*')
    .single()
  if (jobErr) throw jobErr

  let createdFields: JobField[] = []
  if (fields.length > 0) {
    const { data: fieldRows, error: fieldErr } = await supabase
      .from('job_fields')
      .insert(fields.map(f => ({
        job_id: jobRow.id,
        key: f.key,
        label: f.label,
        type: f.type,
        required: f.required,
      })))
      .select('*')
    if (fieldErr) throw fieldErr
    createdFields = fieldRows as JobField[]
  }

  return { job: jobRow as Job, fields: createdFields }
}

export async function listJobFields(jobId: string): Promise<JobField[]> {
  const { data, error } = await supabase
    .from('job_fields')
    .select('*')
    .eq('job_id', jobId)
  if (error) throw error
  return data as JobField[]
}
