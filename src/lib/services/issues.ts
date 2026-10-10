import { supabase } from '../supabase'

/** Fetch the configured fine-per-day from system_settings (defaults to 5 if missing) */
async function getFinePerDay(): Promise<number> {
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'fine_per_day')
    .maybeSingle()
  return data?.value ? Number(data.value) : 5
}

export async function issueBook(userId: string, accessionNumber: string, branchId: number | null, dueDays = 14) {
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + dueDays)
  const offsetMs = dueDate.getTimezoneOffset() * 60 * 1000
  const localDueDate = new Date(dueDate.getTime() - offsetMs)
  const dueDateStr = localDueDate.toISOString().split('T')[0]

  // Copy book details into the issue row. Historical issue records can then
  // remain readable even after a returned book copy is deleted from inventory.
  let bookQuery = supabase
    .from('book_copies')
    .select('title, author, isbn')
    .eq('accession_number', accessionNumber)
  if (branchId != null) bookQuery = bookQuery.eq('branch_id', branchId)

  const { data: book, error: bookLookupErr } = await bookQuery.single()
  if (bookLookupErr || !book) throw bookLookupErr || new Error('Book not found.')

  const { data: issue, error: issueErr } = await supabase
    .from('book_issues')
    .insert({
      accession_number: accessionNumber,
      branch_id: branchId,
      user_id: userId,
      due_date: dueDateStr,
      book_title: book.title,
      book_author: book.author,
      book_isbn: book.isbn,
    })
    .select()
    .single()
  if (issueErr) throw issueErr

  let bookQ = supabase.from('book_copies').update({ status: 'Issued' }).eq('accession_number', accessionNumber)
  if (branchId != null) bookQ = bookQ.eq('branch_id', branchId)
  const { error: bookErr } = await bookQ
  if (bookErr) throw bookErr

  return issue
}

export async function returnBook(accessionNumber: string, branchId?: number | null, customFine?: number) {
  // Find open issue — no join, no branch filter on lookup
  const { data: issue, error: findErr } = await supabase
    .from('book_issues')
    .select('id, due_date, user_id')
    .eq('accession_number', accessionNumber)
    .eq('is_returned', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (findErr || !issue) throw new Error('No active issue found for this accession number.')

  const finePerDay = await getFinePerDay()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [y, m, d] = issue.due_date.split('-').map(Number)
  const dueDate = new Date(y, m - 1, d)
  const overdueDays = Math.max(0, Math.round((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
  const calculatedFine = overdueDays * finePerDay

  // Use admin-overridden fine if provided, otherwise use calculated
  const fine = customFine !== undefined ? customFine : calculatedFine

  const offsetMs = today.getTimezoneOffset() * 60 * 1000
  const localToday = new Date(today.getTime() - offsetMs)

  const { data: updated, error: updateErr } = await supabase
    .from('book_issues')
    .update({ return_date: localToday.toISOString().split('T')[0], fine_amount: fine, is_returned: true })
    .eq('id', issue.id)
    .select()
    .single()
  if (updateErr) throw updateErr

  let bookQ = supabase.from('book_copies').update({ status: 'Available' }).eq('accession_number', accessionNumber)
  if (branchId != null) bookQ = bookQ.eq('branch_id', branchId)
  const { error: bookErr } = await bookQ
  if (bookErr) throw bookErr

  return { ...updated, overdueDays, fine }
}

export async function getIssuedBooks(userId?: string, branchId?: number | null) {
  let query = supabase
    .from('book_issues')
    .select('*')
    .eq('is_returned', false)
    .order('issue_date', { ascending: false })

  if (userId) query = query.eq('user_id', userId)
  if (branchId != null) query = query.eq('branch_id', branchId)

  const { data: issues, error } = await query
  if (error) throw error
  if (!issues || issues.length === 0) return []

  // Enrich with book + user details via separate queries
  const accessions = [...new Set(issues.map(i => i.accession_number))]
  const userIds = [...new Set(issues.map(i => i.user_id))]

  const [{ data: books }, { data: users }] = await Promise.all([
    supabase.from('book_copies').select('accession_number, title, author, branch_id').in('accession_number', accessions),
    supabase.from('users').select('user_id, user_name, branch_id').in('user_id', userIds),
  ])

  const bookMap = Object.fromEntries((books || []).map(b => [b.accession_number, b]))
  const userMap = Object.fromEntries((users || []).map(u => [u.user_id, u]))

  return issues.map(i => ({
    ...i,
    book_copies: bookMap[i.accession_number] || {
      title: i.book_title || i.accession_number,
      author: i.book_author || null,
    },
    users: userMap[i.user_id] || null,
  }))
}

export async function getReturnedBooks(limit = 100, branchId?: number | null) {
  let query = supabase
    .from('book_issues')
    .select('*')
    .eq('is_returned', true)
    .order('return_date', { ascending: false })
    .limit(limit)

  if (branchId != null) query = query.eq('branch_id', branchId)

  const { data: issues, error } = await query
  if (error) throw error
  if (!issues || issues.length === 0) return []

  const accessions = [...new Set(issues.map(i => i.accession_number))]
  const userIds = [...new Set(issues.map(i => i.user_id))]

  const [{ data: books }, { data: users }] = await Promise.all([
    supabase.from('book_copies').select('accession_number, title, author, branch_id').in('accession_number', accessions),
    supabase.from('users').select('user_id, user_name, branch_id').in('user_id', userIds),
  ])

  const bookMap = Object.fromEntries((books || []).map(b => [b.accession_number, b]))
  const userMap = Object.fromEntries((users || []).map(u => [u.user_id, u]))

  return issues.map(i => ({
    ...i,
    book_copies: bookMap[i.accession_number] || {
      title: i.book_title || i.accession_number,
      author: i.book_author || null,
    },
    users: userMap[i.user_id] || null,
  }))
}

export async function getIssueByAccession(accessionNumber: string, branchId?: number | null) {
  // Fetch issue scoped to this branch
  let query = supabase
    .from('book_issues')
    .select('*')
    .eq('accession_number', accessionNumber)
    .eq('is_returned', false)
    .order('created_at', { ascending: false })
    .limit(1)

  if (branchId != null) query = query.eq('branch_id', branchId)

  const { data: issue, error } = await query.maybeSingle()
  if (error) throw error
  if (!issue) throw new Error('This book has no active issue record for your campus.')

  // Fetch book details separately
  const { data: book } = await supabase
    .from('book_copies')
    .select('title, author')
    .eq('accession_number', accessionNumber)
    .limit(1)
    .maybeSingle()

  // Fetch user name separately
  const { data: user } = await supabase
    .from('users')
    .select('user_name')
    .eq('user_id', issue.user_id)
    .maybeSingle()

  return { ...issue, book_copies: book || null, users: user || null }
}

export async function calculateFine(dueDate: string) {
  const finePerDay = await getFinePerDay()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [y, m, d] = dueDate.split('-').map(Number)
  const due = new Date(y, m - 1, d)
  const diffMs = today.getTime() - due.getTime()
  const overdueDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)))
  return { overdueDays, fine: overdueDays * finePerDay }
}

export async function getCirculationStats() {
  const { count: activeIssues } = await supabase
    .from('book_issues')
    .select('*', { count: 'exact', head: true })
    .eq('is_returned', false)
  const { data: returned } = await supabase
    .from('book_issues')
    .select('fine_amount')
    .eq('is_returned', true)
  const totalFines = returned?.reduce((sum, r) => sum + (r.fine_amount || 0), 0) ?? 0
  return { activeIssues: activeIssues ?? 0, totalFines }
}

export async function getCirculationReport(params: {
  type: 'issued' | 'returned'
  userType: 'student' | 'faculty' | 'all'
  startDate: string
  endDate: string
  branches?: string[]
  departments?: string[]
  branchId?: number | null
}) {
  const { type, userType, startDate, endDate, branches, departments, branchId } = params

  // Step 1: Fetch raw issue records with date filter
  let query = supabase
    .from('book_issues')
    .select('*')
    .eq('is_returned', type === 'returned')

  if (type === 'issued') {
    query = query.gte('issue_date', startDate).lte('issue_date', endDate).order('issue_date', { ascending: false })
  } else {
    query = query.gte('return_date', startDate).lte('return_date', endDate).order('return_date', { ascending: false })
  }

  if (branchId != null) query = query.eq('branch_id', branchId)

  const { data: issues, error } = await query
  if (error) throw error
  if (!issues || issues.length === 0) return []

  // Step 2: Enrich with book + user details (same pattern as getIssuedBooks)
  const accessions = [...new Set(issues.map((i: any) => i.accession_number))]
  const userIds    = [...new Set(issues.map((i: any) => i.user_id))]

  const [{ data: books }, { data: users }] = await Promise.all([
    supabase
      .from('book_copies')
      .select('accession_number, title, author, branch_id')
      .in('accession_number', accessions),
    supabase
      .from('users')
      .select('user_id, user_name, user_type, branch_id, programs(branch_name, branch_code, degree), departments(department_name)')
      .in('user_id', userIds),
  ])

  const bookMap = Object.fromEntries((books || []).map((b: any) => [b.accession_number, b]))
  const userMap = Object.fromEntries((users || []).map((u: any) => [u.user_id, u]))

  let rows = issues.map((i: any) => ({
    ...i,
    book_copies: bookMap[i.accession_number] || { title: i.book_title || i.accession_number, author: i.book_author || null },
    users: userMap[i.user_id] || null,
  }))

  // Client-side filters
  if (userType !== 'all') {
    rows = rows.filter((r: any) => r.users?.user_type === userType)
  }
  if (branches && branches.length > 0) {
    rows = rows.filter((r: any) => r.users?.user_type !== 'student' || branches.includes(r.users?.programs?.branch_code))
  }
  if (departments && departments.length > 0) {
    rows = rows.filter((r: any) => r.users?.user_type !== 'faculty' || departments.includes(r.users?.departments?.department_name))
  }
  return rows
}

