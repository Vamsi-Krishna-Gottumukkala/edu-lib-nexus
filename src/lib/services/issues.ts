import { supabase } from '../supabase'

const FINE_PER_DAY = 5 // will be overridden by settings

export async function issueBook(userId: string, accessionNumber: string, dueDays = 14) {
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + dueDays)
  const dueDateStr = dueDate.toISOString().split('T')[0]

  // 1. Insert issue record
  const { data: issue, error: issueErr } = await supabase
    .from('book_issues')
    .insert({
      accession_number: accessionNumber,
      user_id: userId,
      due_date: dueDateStr,
    })
    .select()
    .single()
  if (issueErr) throw issueErr

  // 2. Update book status to Issued
  const { error: bookErr } = await supabase
    .from('book_copies')
    .update({ status: 'Issued' })
    .eq('accession_number', accessionNumber)
  if (bookErr) throw bookErr

  return issue
}

export async function returnBook(accessionNumber: string) {
  // 1. Find open issue
  const { data: issue, error: findErr } = await supabase
    .from('book_issues')
    .select('*')
    .eq('accession_number', accessionNumber)
    .eq('is_returned', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  if (findErr) throw findErr

  // 2. Calculate fine
  const today = new Date()
  const dueDate = new Date(issue.due_date)
  const diffMs = today.getTime() - dueDate.getTime()
  const overdueDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
  const fine = overdueDays * FINE_PER_DAY

  // 3. Update issue record
  const { data: updated, error: updateErr } = await supabase
    .from('book_issues')
    .update({
      return_date: today.toISOString().split('T')[0],
      fine_amount: fine,
      is_returned: true,
    })
    .eq('id', issue.id)
    .select()
    .single()
  if (updateErr) throw updateErr

  // 4. Update book status to Available
  const { error: bookErr } = await supabase
    .from('book_copies')
    .update({ status: 'Available' })
    .eq('accession_number', accessionNumber)
  if (bookErr) throw bookErr

  return { ...updated, overdueDays, fine }
}

export async function getIssuedBooks(userId?: string) {
  let query = supabase
    .from('book_issues')
    .select('*, book_copies(title, author, accession_number), users(user_name)')
    .eq('is_returned', false)
    .order('issue_date', { ascending: false })

  if (userId) query = query.eq('user_id', userId)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getReturnedBooks(limit = 100) {
  const { data, error } = await supabase
    .from('book_issues')
    .select('*, book_copies(title, author, accession_number), users(user_name)')
    .eq('is_returned', true)
    .order('return_date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function getIssueByAccession(accessionNumber: string) {
  const { data, error } = await supabase
    .from('book_issues')
    .select('*, book_copies(title, author), users(user_name)')
    .eq('accession_number', accessionNumber)
    .eq('is_returned', false)
    .single()
  if (error) throw error
  return data
}

export async function calculateFine(dueDate: string) {
  const today = new Date()
  const due = new Date(dueDate)
  const diffMs = today.getTime() - due.getTime()
  const overdueDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
  return { overdueDays, fine: overdueDays * FINE_PER_DAY }
}

export async function getCirculationStats() {
  const { data: issued } = await supabase
    .from('book_issues')
    .select('*', { count: 'exact', head: true })
    .eq('is_returned', false)
  const { data: returned } = await supabase
    .from('book_issues')
    .select('fine_amount')
    .eq('is_returned', true)
  const totalFines = returned?.reduce((sum, r) => sum + (r.fine_amount || 0), 0) ?? 0
  return { activeIssues: (issued as any)?.count ?? 0, totalFines }
}
