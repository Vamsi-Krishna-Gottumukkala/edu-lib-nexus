import { supabase } from '../supabase'

export async function getBranches() {
  const { data, error } = await supabase
    .from('library_branches')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

export async function getBranchById(id: number) {
  const { data, error } = await supabase
    .from('library_branches')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function addBranch(branch: { name: string; location?: string; librarian?: string }) {
  const { data, error } = await supabase
    .from('library_branches')
    .insert(branch)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateBranch(id: number, updates: { name?: string; location?: string; librarian?: string }) {
  const { data, error } = await supabase
    .from('library_branches')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteBranch(id: number) {
  const { error } = await supabase.from('library_branches').delete().eq('id', id)
  if (error) throw error
}

export async function getBranchStats() {
  const { data: branches } = await supabase.from('library_branches').select('id, name')
  const { data: books } = await supabase.from('book_copies').select('branch_id, status')

  return branches?.map(branch => {
    const branchBooks = books?.filter(b => b.branch_id === branch.id) ?? []
    return {
      ...branch,
      total: branchBooks.length,
      available: branchBooks.filter(b => b.status === 'Available').length,
      issued: branchBooks.filter(b => b.status === 'Issued').length,
    }
  }) ?? []
}
