import { supabase, QuestionPaper } from '../supabase'

export async function getPapers(filters?: {
  department?: string
  semester?: number
  exam_type?: string
  academic_year?: string
  search?: string
  branch_id?: number | null
}) {
  let query = supabase
    .from('question_papers')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.department) query = query.eq('department', filters.department)
  if (filters?.semester) query = query.eq('semester', filters.semester)
  if (filters?.exam_type) query = query.eq('exam_type', filters.exam_type)
  if (filters?.academic_year) query = query.eq('academic_year', filters.academic_year)
  if (filters?.search) query = query.ilike('subject_name', `%${filters.search}%`)
  if (filters?.branch_id != null) query = query.eq('branch_id', filters.branch_id)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function uploadPaper(
  paperData: Omit<QuestionPaper, 'id' | 'file_url' | 'downloads' | 'upload_date' | 'created_at'> & { branch_id?: number | null },
  file: File
) {
  // 1. Upload file to Supabase Storage
  const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`
  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from('question-papers')
    .upload(fileName, file, { contentType: 'application/pdf', upsert: false })
  if (uploadErr) throw uploadErr

  // 2. Get public URL
  const { data: urlData } = supabase.storage
    .from('question-papers')
    .getPublicUrl(fileName)

  // 3. Insert DB record
  const { data, error } = await supabase
    .from('question_papers')
    .insert({ ...paperData, file_url: urlData.publicUrl })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function incrementDownload(id: number) {
  const { error } = await supabase.rpc('increment_downloads', { paper_id: id })
  if (error) {
    const { data: paper } = await supabase
      .from('question_papers')
      .select('downloads')
      .eq('id', id)
      .single()
    if (paper) {
      await supabase
        .from('question_papers')
        .update({ downloads: (paper.downloads || 0) + 1 })
        .eq('id', id)
    }
  }
}

export async function deletePaper(id: number) {
  const { data: paper } = await supabase
    .from('question_papers')
    .select('file_url')
    .eq('id', id)
    .single()

  if (paper?.file_url) {
    const fileName = paper.file_url.split('/').pop()
    if (fileName) {
      await supabase.storage.from('question-papers').remove([fileName])
    }
  }

  const { error } = await supabase.from('question_papers').delete().eq('id', id)
  if (error) throw error
}

export async function getPaperStats(branchId?: number | null) {
  let query = supabase.from('question_papers').select('department, downloads')
  if (branchId != null) query = query.eq('branch_id', branchId)

  const { data, error } = await query
  if (error) throw error

  const byDept: Record<string, { count: number; downloads: number }> = {}
  data?.forEach(p => {
    const dept = p.department || 'Other'
    if (!byDept[dept]) byDept[dept] = { count: 0, downloads: 0 }
    byDept[dept].count++
    byDept[dept].downloads += p.downloads || 0
  })
  return byDept
}
