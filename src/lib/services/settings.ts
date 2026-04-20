import { supabase } from '../supabase'

export async function getSettings() {
  const { data, error } = await supabase.from('system_settings').select('*')
  if (error) throw error
  // Convert to key-value object
  return Object.fromEntries((data ?? []).map(s => [s.key, s.value])) as Record<string, string>
}

export async function getSetting(key: string) {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .single()
  if (error) return null
  return data?.value
}

export async function updateSetting(key: string, value: string) {
  const { data, error } = await supabase
    .from('system_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSettings(settings: Record<string, string>) {
  const rows = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }))
  const { error } = await supabase.from('system_settings').upsert(rows)
  if (error) throw error
}
