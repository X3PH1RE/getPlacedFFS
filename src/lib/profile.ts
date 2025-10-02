import { supabase } from './supabaseClient'

export type StudentProfile = {
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
  created_at?: string
  updated_at?: string
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', userId)
    .maybeSingle<StudentProfile>()
  if (error) throw error
  return data
}

export async function hasProfile(userId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('id', userId)
  if (error) throw error
  return (count ?? 0) > 0
}

export async function upsertProfile(userId: string, payload: Partial<StudentProfile>) {
  // Omit generated/readonly columns that must not be set by clients
  const {
    student_no: _omitStudentNo,
    created_at: _omitCreatedAt,
    updated_at: _omitUpdatedAt,
    ...rest
  } = payload

  const toSave = { id: userId, ...rest }
  const { data, error } = await supabase
    .from('students')
    .upsert(toSave, { onConflict: 'id' })
    .select('*')
    .maybeSingle<StudentProfile>()
  if (error) throw error
  return data
}
