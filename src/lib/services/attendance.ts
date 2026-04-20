import { supabase } from '../supabase'

/** For attendance queries, branch isolation is done by filtering on
 *  users.branch_id — we use an !inner join so only matching rows appear.
 */

/** Returns today's date in YYYY-MM-DD using LOCAL time (not UTC).
 *  Important for IST users: toISOString() returns UTC and can give yesterday's date.
 */
function localToday(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export async function getAttendanceLogs(date?: string, branchId?: number | null) {
  let query = supabase
    .from('attendance_log')
    .select('*, users!inner(user_name, user_type, branch_id, programs(branch_name, degree, branch_code), departments(department_name))')
    .order('log_date', { ascending: false })
    .order('login_time', { ascending: false })

  if (date) query = query.eq('log_date', date)
  if (branchId != null) query = query.eq('users.branch_id', branchId)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getTodayAttendanceLogs(branchId?: number | null) {
  const today = localToday()
  return getAttendanceLogs(today, branchId)
}

export async function getTodayCount(branchId?: number | null) {
  const today = localToday()

  if (branchId != null) {
    // Need to join through users to filter by branch
    const { data, error } = await supabase
      .from('attendance_log')
      .select('log_id, users!inner(branch_id)')
      .eq('log_date', today)
      .eq('users.branch_id', branchId)
    if (error) throw error
    return data?.length ?? 0
  }

  const { count, error } = await supabase
    .from('attendance_log')
    .select('*', { count: 'exact', head: true })
    .eq('log_date', today)
  if (error) throw error
  return count ?? 0
}

export async function getStudentAttendanceLogs(userId: string) {
  const { data, error } = await supabase
    .from('attendance_log')
    .select('*')
    .eq('user_id', userId)
    .order('log_date', { ascending: false })
    .order('login_time', { ascending: false })
  if (error) throw error
  return data
}

export async function getVisitHistory(limit = 100, branchId?: number | null) {
  let query = supabase
    .from('attendance_log')
    .select('*, users!inner(user_name, user_type, branch_id, programs(branch_name))')
    .order('log_date', { ascending: false })
    .limit(limit)

  if (branchId != null) query = query.eq('users.branch_id', branchId)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getAttendanceStats(branchId?: number | null) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const y = thirtyDaysAgo.getFullYear()
  const m = String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')
  const d = String(thirtyDaysAgo.getDate()).padStart(2, '0')
  const fromDate = `${y}-${m}-${d}`

  let query: any
  if (branchId != null) {
    const { data, error } = await supabase
      .from('attendance_log')
      .select('log_date, users!inner(branch_id)')
      .gte('log_date', fromDate)
      .eq('users.branch_id', branchId)
      .order('log_date')
    if (error) throw error
    const counts: Record<string, number> = {}
    data?.forEach(log => { counts[log.log_date] = (counts[log.log_date] || 0) + 1 })
    return Object.entries(counts).map(([date, count]) => ({ date, count }))
  }

  const { data, error } = await supabase
    .from('attendance_log')
    .select('log_date')
    .gte('log_date', fromDate)
    .order('log_date')
  if (error) throw error
  const counts: Record<string, number> = {}
  data?.forEach(log => { counts[log.log_date] = (counts[log.log_date] || 0) + 1 })
  return Object.entries(counts).map(([date, count]) => ({ date, count }))
}

// ─── Enhanced / New Functions ──────────────────────────────────

/** Manually set logout_time = now for a specific log row */
export async function manualLogout(logId: number) {
  const time = new Date().toTimeString().slice(0, 8)
  const { error } = await supabase
    .from('attendance_log')
    .update({ logout_time: time })
    .eq('log_id', logId)
    .is('logout_time', null)
  if (error) throw error
}

/** Logout ALL students currently in the library today (optionally scoped to a branch) */
export async function logoutAllStudents(branchId?: number | null) {
  const today = localToday()
  const time = new Date().toTimeString().slice(0, 8)

  const { data: openLogs, error: fetchErr } = await supabase
    .from('attendance_log')
    .select('log_id, users!inner(user_type, branch_id)')
    .eq('log_date', today)
    .is('logout_time', null)
    .eq('users.user_type', 'student')
  if (fetchErr) throw fetchErr

  let rows = (openLogs ?? []) as any[]
  if (branchId != null) rows = rows.filter((r: any) => r.users?.branch_id === branchId)

  const ids = rows.map((l: any) => l.log_id)
  if (ids.length === 0) return 0

  const { error } = await supabase
    .from('attendance_log')
    .update({ logout_time: time })
    .in('log_id', ids)
  if (error) throw error
  return ids.length
}

/** Today's visitor counts for pie charts, optionally scoped to a branch */
export async function getTodayBranchCounts(branchId?: number | null) {
  const today = localToday()

  let query = supabase
    .from('attendance_log')
    .select('users!inner(user_type, branch_id, programs(degree, branch_code, branch_name), departments(department_name))')
    .eq('log_date', today)

  if (branchId != null) query = (query as any).eq('users.branch_id', branchId)

  const { data: todayLogs, error } = await query
  if (error) throw error

  const degreeMap: Record<string, Record<string, { branch_name: string; count: number }>> = {}
  const facultyMap: Record<string, number> = {}

  for (const row of (todayLogs ?? []) as any[]) {
    const user = row.users
    if (!user) continue
    if (user.user_type === 'student' && user.programs) {
      const { degree, branch_code, branch_name } = user.programs
      if (!degree || !branch_code) continue
      if (!degreeMap[degree]) degreeMap[degree] = {}
      if (!degreeMap[degree][branch_code]) degreeMap[degree][branch_code] = { branch_name: branch_name ?? branch_code, count: 0 }
      degreeMap[degree][branch_code].count++
    } else if (user.user_type === 'faculty') {
      const dept = user.departments?.department_name ?? 'Other'
      facultyMap[dept] = (facultyMap[dept] ?? 0) + 1
    }
  }

  return { degreeMap, facultyMap }
}

/** Attendance logs between two dates — for the Report Generator page */
export async function getAttendanceReport(params: {
  userType: 'student' | 'faculty'
  startDate: string
  endDate: string
  branches?: string[]
  departments?: string[]
  branchId?: number | null
}) {
  const { userType, startDate, endDate, branches, departments, branchId } = params

  let query = supabase
    .from('attendance_log')
    .select('log_id, user_id, log_date, login_time, logout_time, users!inner(user_name, user_type, branch_id, programs(branch_name, branch_code, degree), departments(department_name))')
    .eq('users.user_type', userType)
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date')
    .order('login_time')

  if (branchId != null) query = (query as any).eq('users.branch_id', branchId)

  const { data, error } = await query
  if (error) throw error

  let rows = (data ?? []) as any[]
  if (userType === 'student' && branches && branches.length > 0) {
    rows = rows.filter(r => branches.includes(r.users?.programs?.branch_code))
  }
  if (userType === 'faculty' && departments && departments.length > 0) {
    rows = rows.filter(r => departments.includes(r.users?.departments?.department_name))
  }
  return rows
}
