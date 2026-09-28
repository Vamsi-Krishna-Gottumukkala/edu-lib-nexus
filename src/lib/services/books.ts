import { supabase, BookCopy } from '../supabase'

/** Bulk insert books from an Excel upload */
export async function bulkInsertBooks(rows: Array<Omit<BookCopy, 'created_at'>>) {
  const { error } = await supabase
    .from('book_copies')
    .upsert(rows, { onConflict: 'accession_number,branch_id' })
  if (error) throw error
  return rows.length
}

export async function getBooks(filters?: {
  status?: string
  category?: string
  branch_id?: number | null
  search?: string
}) {
  let query = supabase
    .from('book_copies')
    .select('*, library_branches(name)')
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.category) query = query.eq('category', filters.category)
  if (filters?.branch_id != null) query = query.eq('branch_id', filters.branch_id)
  if (filters?.search) {
    if (/^\d+$/.test(filters.search)) {
      query = query.or(
        `title.ilike.%${filters.search}%,author.ilike.%${filters.search}%,accession_number.eq.${filters.search},isbn.ilike.%${filters.search}%`
      )
    } else {
      query = query.or(
        `title.ilike.%${filters.search}%,author.ilike.%${filters.search}%,accession_number.ilike.%${filters.search}%,isbn.ilike.%${filters.search}%`
      )
    }
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getBookByAccession(accessionNumber: string, branchId?: number | null) {
  let query = supabase
    .from('book_copies')
    .select('*, library_branches(name)')
    .eq('accession_number', accessionNumber)
    
  if (branchId != null) query = query.eq('branch_id', branchId)

  const { data, error } = await query.single()
  if (error) throw error
  return data
}

export async function addBook(book: Omit<BookCopy, 'created_at'>) {
  const { data, error } = await supabase
    .from('book_copies')
    .insert(book)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateBookStatus(accessionNumber: string, status: BookCopy['status'], branchId?: number | null) {
  let query = supabase
    .from('book_copies')
    .update({ status })
    .eq('accession_number', accessionNumber)

  if (branchId != null) query = query.eq('branch_id', branchId)

  const { data, error } = await query.select().single()
  if (error) throw error
  return data
}

export async function updateBook(accessionNumber: string, updates: Partial<BookCopy>, branchId?: number | null) {
  let query = supabase
    .from('book_copies')
    .update(updates)
    .eq('accession_number', accessionNumber)

  if (branchId != null) query = query.eq('branch_id', branchId)

  const { data, error } = await query.select().single()
  if (error) throw error
  return data
}

/** Returns accurate counts using server-side COUNT — bypasses Supabase 1000-row cap */
export async function getInventoryStats(branchId?: number | null) {
  const makeQuery = (status?: string) => {
    let q = supabase
      .from('book_copies')
      .select('*', { count: 'exact', head: true })
    if (branchId != null) q = q.eq('branch_id', branchId)
    if (status) q = q.eq('status', status)
    return q
  }

  const [total, available, issued, lost, withdrawn, transferred] = await Promise.all([
    makeQuery(),
    makeQuery('Available'),
    makeQuery('Issued'),
    makeQuery('Lost'),
    makeQuery('Withdrawn'),
    makeQuery('Transferred'),
  ])

  if (total.error) throw total.error

  return {
    total:       total.count       ?? 0,
    available:   available.count   ?? 0,
    issued:      issued.count      ?? 0,
    lost:        lost.count        ?? 0,
    withdrawn:   withdrawn.count   ?? 0,
    transferred: transferred.count ?? 0,
  }
}

/** Server-side paginated books — returns { data, totalCount } */
export async function getBooksPaginated(params: {
  page: number
  pageSize?: number
  status?: string
  branch_id?: number | null
  search?: string
}) {
  const { page, pageSize = 100, status, branch_id, search } = params
  const from = page * pageSize
  const to   = from + pageSize - 1

  let query = supabase
    .from('book_copies')
    .select('*, library_branches(name)', { count: 'exact' })
    .order('accession_number', { ascending: true })
    .range(from, to)

  if (status) query = query.eq('status', status)
  if (branch_id != null) query = query.eq('branch_id', branch_id)
  if (search) {
    if (/^\d+$/.test(search)) {
      query = query.or(
        `title.ilike.%${search}%,author.ilike.%${search}%,accession_number.eq.${search},isbn.ilike.%${search}%`
      )
    } else {
      query = query.or(
        `title.ilike.%${search}%,author.ilike.%${search}%,accession_number.ilike.%${search}%,isbn.ilike.%${search}%`
      )
    }
  }

  const { data, error, count } = await query
  if (error) throw error
  return { data: data ?? [], totalCount: count ?? 0 }
}

export async function getCategories() {
  const { data, error } = await supabase
    .from('book_copies')
    .select('category')
    .not('category', 'is', null)
  if (error) throw error
  const unique = [...new Set(data?.map(d => d.category).filter(Boolean))]
  return unique as string[]
}

export async function searchBooks(query: string, branchId?: number | null) {
  let q = supabase
    .from('book_copies')
    .select('accession_number, title, author, isbn, status')

  if (/^\d+$/.test(query)) {
    q = q.or(`title.ilike.%${query}%,author.ilike.%${query}%,accession_number.eq.${query}`)
  } else {
    q = q.or(`title.ilike.%${query}%,author.ilike.%${query}%,accession_number.ilike.%${query}%`)
  }

  q = q.limit(10)

  if (branchId != null) q = q.eq('branch_id', branchId)

  const { data, error } = await q
  if (error) throw error
  return data
}

/**
 * Returns every circulation record for the requested copies.
 *
 * A book copy must keep its borrowing history intact, so a copy is deletable
 * only when it has never been issued. This also mirrors the database foreign
 * key from book_issues to book_copies.
 */
export async function checkBookDependencies(accessionNumbers: string[], branchId?: number | null) {
  if (accessionNumbers.length === 0) return []

  let query = supabase
    .from('book_issues')
    .select('accession_number, user_id, issue_date, due_date, return_date, is_returned')
    .in('accession_number', accessionNumbers)

  if (branchId != null) query = query.eq('branch_id', branchId)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

/** Permanently delete copies that have no circulation records. */
export async function deleteBooks(accessionNumbers: string[], branchId?: number | null) {
  if (accessionNumbers.length === 0) return 0

  // Check again at the data-service boundary. The UI checks first to show a
  // helpful explanation, while this prevents a direct caller from bypassing it.
  const dependencies = await checkBookDependencies(accessionNumbers, branchId)
  if (dependencies.length > 0) {
    throw new Error('Books with student or faculty borrowing records cannot be deleted.')
  }

  let query = supabase
    .from('book_copies')
    .delete()
    .in('accession_number', accessionNumbers)

  if (branchId != null) query = query.eq('branch_id', branchId)

  const { data, error } = await query.select('accession_number')
  if (error) throw error
  return data?.length ?? 0
}
