import { supabase, LibUser } from '../supabase'
import { toTitleCase } from '../utils'

/** All user queries accept an optional branchId.
 *  - branchId = null  → super-admin; returns all users
 *  - branchId = N     → branch admin; only users in that branch
 */

export async function getUsers(filter?: {
  userType?: string
  search?: string
  branchId?: number | null
}) {
  let query = supabase
    .from('users')
    .select('*, programs(branch_name, degree, branch_code), departments(department_name)')
    .order('user_name')

  if (filter?.userType) query = query.eq('user_type', filter.userType)
  if (filter?.search) query = query.or(`user_id.ilike.%${filter.search}%,user_name.ilike.%${filter.search}%`)
  if (filter?.branchId != null) query = query.eq('branch_id', filter.branchId)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getUserById(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*, programs(program_id, branch_name, degree, branch_code), departments(department_id, department_name)')
    .eq('user_id', userId)
    .single()
  if (error) throw error
  return data
}

export async function searchUsers(query: string, branchId?: number | null) {
  let q = supabase
    .from('users')
    .select('user_id, user_name, user_type, programs(branch_name)')
    .or(`user_id.ilike.%${query}%,user_name.ilike.%${query}%`)
    .limit(10)

  if (branchId != null) q = q.eq('branch_id', branchId)

  const { data, error } = await q
  if (error) throw error
  return data
}

export async function getTotalUserCount(branchId?: number | null) {
  let query = supabase.from('users').select('*', { count: 'exact', head: true })
  if (branchId != null) query = query.eq('branch_id', branchId)
  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

// ─── CRUD ────────────────────────────────────────────────────

export async function addStudent(data: {
  user_id: string
  user_name: string
  year: number | null
  program_id: number | null
  branch_id: number | null
}) {
  const { error } = await supabase.from('users').insert({
    ...data,
    user_name: toTitleCase(data.user_name),
    user_type: 'student',
  })
  if (error) throw error
}

export async function addFaculty(data: {
  user_id: string
  user_name: string
  designation: string | null
  department_id: number | null
  branch_id: number | null
}) {
  const { error } = await supabase.from('users').insert({
    ...data,
    user_name: toTitleCase(data.user_name),
    user_type: 'faculty',
  })
  if (error) throw error
}

export async function updateUser(userId: string, data: Partial<LibUser>) {
  const normalized = data.user_name ? { ...data, user_name: toTitleCase(data.user_name) } : data
  const { error } = await supabase.from('users').update(normalized).eq('user_id', userId)
  if (error) throw error
}

/** Delete a user and cascade their RFID/attendance records */
export async function deleteUser(userId: string) {
  await supabase.from('attendance_log').delete().eq('user_id', userId)
  await supabase.from('rfid_details').delete().eq('user_id', userId)
  const { error } = await supabase.from('users').delete().eq('user_id', userId)
  if (error) throw error
}

/** Bulk insert students; branch_id is stamped on every row */
export async function bulkInsertStudents(rows: Array<{
  user_id: string
  user_name: string
  year: number | null
  program_id: number | null
  branch_id: number | null
}>) {
  const payload = rows.map(r => ({
    ...r,
    user_name: toTitleCase(r.user_name),
    user_type: 'student' as const,
  }))
  const { error } = await supabase.from('users').upsert(payload, { onConflict: 'user_id' })
  if (error) throw error
  return rows.length
}

/** Bulk insert faculty */
export async function bulkInsertFaculty(rows: Array<{
  user_id: string
  user_name: string
  designation: string | null
  department_id: number | null
  branch_id: number | null
}>) {
  const payload = rows.map(r => ({
    ...r,
    user_name: toTitleCase(r.user_name),
    user_type: 'faculty' as const,
  }))
  const { error } = await supabase.from('users').upsert(payload, { onConflict: 'user_id' })
  if (error) throw error
  return rows.length
}

/** Mass-delete all students in a given program + year (in a specific branch if provided) */
export async function massDeleteStudents(programId: number, year: number, branchId?: number | null) {
  let q = supabase
    .from('users')
    .select('user_id')
    .eq('user_type', 'student')
    .eq('program_id', programId)
    .eq('year', year)
  if (branchId != null) q = q.eq('branch_id', branchId)

  const { data, error: fetchErr } = await q
  if (fetchErr) throw fetchErr
  const ids = (data ?? []).map(u => u.user_id)
  if (ids.length === 0) return 0

  await supabase.from('attendance_log').delete().in('user_id', ids)
  await supabase.from('rfid_details').delete().in('user_id', ids)
  const { error } = await supabase.from('users').delete().in('user_id', ids)
  if (error) throw error
  return ids.length
}
