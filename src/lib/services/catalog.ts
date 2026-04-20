import { supabase } from '../supabase'

// ─── Programs ─────────────────────────────────────────────────

export async function getPrograms() {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .order('degree')
    .order('branch_name')
  if (error) throw error
  return data ?? []
}

export async function addProgram(data: { degree: string; branch_name: string; branch_code: string }) {
  const { error } = await supabase.from('programs').insert({
    ...data,
    branch_code: data.branch_code.toUpperCase(),
  })
  if (error) throw error
}

export async function deleteProgram(programId: number) {
  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('program_id', programId)
  if (count && count > 0) throw new Error(`Cannot delete: ${count} students are in this program.`)
  const { error } = await supabase.from('programs').delete().eq('program_id', programId)
  if (error) throw error
}

// ─── Departments ───────────────────────────────────────────────

export async function getDepartments() {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('department_name')
  if (error) throw error
  return data ?? []
}

export async function addDepartment(departmentName: string) {
  const { error } = await supabase.from('departments').insert({ department_name: departmentName.trim() })
  if (error) throw error
}

export async function deleteDepartment(departmentId: number) {
  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('department_id', departmentId)
  if (count && count > 0) throw new Error(`Cannot delete: ${count} faculty are in this department.`)
  const { error } = await supabase.from('departments').delete().eq('department_id', departmentId)
  if (error) throw error
}

// ─── RFID ─────────────────────────────────────────────────────

export async function getRFIDByUser(userId: string) {
  const { data, error } = await supabase
    .from('rfid_details')
    .select('uid, user_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getRFIDByUID(uid: string) {
  const { data, error } = await supabase
    .from('rfid_details')
    .select('uid, user_id, users(user_name, user_type)')
    .eq('uid', uid)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertRFID(userId: string, uid: string) {
  const { data: existing } = await supabase
    .from('rfid_details')
    .select('user_id')
    .eq('uid', uid)
    .neq('user_id', userId)
    .maybeSingle()
  if (existing) throw new Error(`UID ${uid} is already assigned to user ${existing.user_id}`)

  await supabase.from('rfid_details').delete().eq('user_id', userId)
  const { error } = await supabase.from('rfid_details').insert({ uid, user_id: userId })
  if (error) throw error
}

export async function removeRFID(userId: string) {
  const { error } = await supabase.from('rfid_details').delete().eq('user_id', userId)
  if (error) throw error
}

/** Get all RFID mappings, optionally scoped to users of a specific branch */
export async function getAllRFIDMappings(branchId?: number | null) {
  let query = supabase
    .from('rfid_details')
    .select('uid, user_id, users!inner(user_name, user_type, branch_id, programs(branch_name))')
    .order('user_id')

  if (branchId != null) query = (query as any).eq('users.branch_id', branchId)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
