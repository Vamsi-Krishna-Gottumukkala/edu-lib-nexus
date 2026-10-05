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
  const { data: branches } = await supabase.from('library_branches').select('*')
  
  if (!branches) return []

  const stats = await Promise.all(branches.map(async (branch) => {
    const { count: total } = await supabase.from('book_copies').select('*', { count: 'exact', head: true }).eq('branch_id', branch.id)
    const { count: available } = await supabase.from('book_copies').select('*', { count: 'exact', head: true }).eq('branch_id', branch.id).eq('status', 'Available')
    const { count: issued } = await supabase.from('book_copies').select('*', { count: 'exact', head: true }).eq('branch_id', branch.id).eq('status', 'Issued')

    return {
      ...branch,
      total: total || 0,
      available: available || 0,
      issued: issued || 0,
    }
  }))

  return stats
}
