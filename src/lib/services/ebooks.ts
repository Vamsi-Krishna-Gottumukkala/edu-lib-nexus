import { Ebook, supabase } from '../supabase'

export function isValidEbookUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export async function getEbooks(filters?: { subject?: string; bookName?: string }) {
  let query = supabase
    .from('ebooks')
    .select('*')
    .order('subject_name')
    .order('book_name')

  if (filters?.subject) query = query.ilike('subject_name', `%${filters.subject}%`)
  if (filters?.bookName) query = query.ilike('book_name', `%${filters.bookName}%`)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Ebook[]
}

export async function addEbook(ebook: Pick<Ebook, 'subject_name' | 'book_name' | 'url'>) {
  const { data, error } = await supabase
    .from('ebooks')
    .insert(ebook)
    .select()
    .single()
  if (error) throw error
  return data as Ebook
}

export async function deleteEbook(id: number) {
  const { error } = await supabase.from('ebooks').delete().eq('id', id)
  if (error) throw error
}
