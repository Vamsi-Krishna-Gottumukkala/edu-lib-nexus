import { supabase } from '../supabase'

const FINE_PER_DAY = 5

export async function issueBook(userId: string, accessionNumber: string, branchId: number | null, dueDays = 14) {
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + dueDays)
  const dueDateStr = dueDate.toISOString().split('T')[0]

  const { data: issue, error: issueErr } = await supabase
    .from('book_issues')
    .insert({ accession_number: accessionNumber, branch_id: branchId, user_id: userId, due_date: dueDateStr })
    .select()
    .single()
  if (issueErr) throw issueErr

  let bookQ = supabase.from('book_copies').update({ status: 'Issued' }).eq('accession_number', accessionNumber)
  if (branchId != null) bookQ = bookQ.eq('branch_id', branchId)
  const { error: bookErr } = await bookQ
  if (bookErr) throw bookErr

  return issue
}

export async function returnBook(accessionNumber: string, branchId?: number | null) {
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

  const today = new Date()
  const dueDate = new Date(issue.due_date)
  const overdueDays = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
  const fine = overdueDays * FINE_PER_DAY

  const { data: updated, error: updateErr } = await supabase
    .from('book_issues')
    .update({ return_date: today.toISOString().split('T')[0], fine_amount: fine, is_returned: true })
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
    book_copies: bookMap[i.accession_number] || null,
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
    book_copies: bookMap[i.accession_number] || null,
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
  const today = new Date()
  const due = new Date(dueDate)
  const diffMs = today.getTime() - due.getTime()
  const overdueDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
  return { overdueDays, fine: overdueDays * FINE_PER_DAY }
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
