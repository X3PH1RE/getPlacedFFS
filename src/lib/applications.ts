import { supabase } from './supabaseClient'
import { getProfile } from './profile'
import { getJob } from './jobs'

export type Application = {
  id: string
  job_id: string
  user_id: string
  created_at?: string
}

export type ApplicationRow = {
  id: string
  job_id: string
  user_id: string
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
  extra_fields?: Record<string, any>
  created_at?: string
}

export async function applyToJob(jobId: string, userId: string, extraFields?: Record<string, any>) {
  // Enforce CGPA eligibility before inserting application
  const [job, profile] = await Promise.all([
    getJob(jobId),
    getProfile(userId),
  ])

  // Block if profile is incomplete (required fields missing)
  const requiredKeys: Array<keyof NonNullable<typeof profile>> = [
    'name',
    'gender',
    'email',
    'contact_no',
    'department',
    'course',
    'date_of_birth',
    'home_town',
    'languages_known',
    'tenth_percent',
    'twelfth_or_diploma_percent',
    'ug_cgpa',
    'backlogs',
    'year_of_passing',
  ]
  const isBlank = (v: any) => v == null || (typeof v === 'string' && v.trim() === '')
  const hasIncomplete = !profile || requiredKeys.some(k => isBlank((profile as any)[k]))
  if (hasIncomplete) {
    throw new Error('Complete your profile before applying')
  }

  if (job && job.min_ug_cgpa != null) {
    const userCgpa = profile?.ug_cgpa
    if (userCgpa == null || userCgpa < job.min_ug_cgpa) {
      throw new Error("You can't apply because of your CGPA")
    }
  }

  const { data: app, error } = await supabase
    .from('applications')
    .insert({ job_id: jobId, user_id: userId })
    .select('*')
    .single<Application>()
  if (error) throw error

  // Optional denormalized insert for export/public sheets
  if (profile) {
    // Try with extra_fields first, fallback to without if column doesn't exist
    const insertData = {
      job_id: jobId,
      user_id: userId,
      student_no: profile.student_no,
      name: profile.name,
      gender: profile.gender,
      email: profile.email,
      contact_no: profile.contact_no,
      department: profile.department,
      course: profile.course,
      date_of_birth: profile.date_of_birth,
      home_town: profile.home_town,
      languages_known: profile.languages_known,
      tenth_percent: profile.tenth_percent,
      twelfth_or_diploma_percent: profile.twelfth_or_diploma_percent,
      ug_cgpa: profile.ug_cgpa,
      pg_cgpa: profile.pg_cgpa,
      backlogs: profile.backlogs,
      year_of_passing: profile.year_of_passing,
      ...(extraFields || {}), // Spread extra fields as individual columns
    }
    
    const { error: rowError } = await supabase.from('application_rows').insert(insertData)
    if (rowError) {
      console.error('Failed to insert application row:', rowError)
      // Don't throw here - the main application was successful
    }
  }

  return app
}

export async function listAppliedJobIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('job_id')
    .eq('user_id', userId)
  if (error) throw error
  return (data ?? []).map(r => r.job_id)
}

export async function listApplicationRows(jobId: string): Promise<ApplicationRow[]> {
  const { data, error } = await supabase
    .from('application_rows')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as ApplicationRow[]
}

export async function listApplicationsWithProfiles(jobId: string): Promise<ApplicationRow[]> {
  const { data: apps, error } = await supabase
    .from('applications')
    .select('id, job_id, user_id, created_at')
    .eq('job_id', jobId)
  if (error) throw error
  const applications = apps ?? []
  if (applications.length === 0) return []

  const userIds = Array.from(new Set(applications.map(a => a.user_id)))

  const { data: profiles, error: profErr } = await supabase
    .from('students')
    .select('id, student_no, name, gender, email, contact_no, department, course, date_of_birth, home_town, languages_known, tenth_percent, twelfth_or_diploma_percent, ug_cgpa, pg_cgpa, backlogs, year_of_passing')
    .in('id', userIds)
  if (profErr) throw profErr
  const idToProfile = new Map((profiles ?? []).map((p: any) => [p.id, p]))

  // Also fetch application_rows for extra fields data
  const { data: rows, error: rowsErr } = await supabase
    .from('application_rows')
    .select('user_id, extra_fields')
    .eq('job_id', jobId)
  if (rowsErr) throw rowsErr
  const userIdToExtraFields = new Map((rows ?? []).map((r: any) => [r.user_id, r.extra_fields || {}]))

  return applications.map(a => {
    const p = idToProfile.get(a.user_id) || {}
    const extraFields = userIdToExtraFields.get(a.user_id) || {}
    return {
      id: a.id,
      job_id: a.job_id,
      user_id: a.user_id,
      created_at: a.created_at,
      student_no: p.student_no ?? null,
      name: p.name ?? '',
      gender: p.gender ?? '',
      email: p.email ?? '',
      contact_no: p.contact_no ?? '',
      department: p.department ?? '',
      course: p.course ?? '',
      date_of_birth: p.date_of_birth ?? '',
      home_town: p.home_town ?? '',
      languages_known: p.languages_known ?? '',
      tenth_percent: p.tenth_percent ?? null,
      twelfth_or_diploma_percent: p.twelfth_or_diploma_percent ?? null,
      ug_cgpa: p.ug_cgpa ?? null,
      pg_cgpa: p.pg_cgpa ?? null,
      backlogs: p.backlogs ?? null,
      year_of_passing: p.year_of_passing ?? null,
      extra_fields: extraFields,
    } as ApplicationRow
  })
}
