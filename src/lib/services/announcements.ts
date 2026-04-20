import { supabase } from '../supabase'

export async function getAnnouncements(activeOnly = false) {
  let query = supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
  if (activeOnly) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function addAnnouncement(text: string) {
  const { data, error } = await supabase
    .from('announcements')
    .insert({ text, is_active: true })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toggleAnnouncement(id: number, isActive: boolean) {
  const { data, error } = await supabase
    .from('announcements')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteAnnouncement(id: number) {
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) throw error
}
