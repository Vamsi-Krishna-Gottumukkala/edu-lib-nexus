import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Database Types ───────────────────────────────────────────

export type UserType = 'student' | 'faculty'
export type BookStatus = 'Available' | 'Issued' | 'Transferred' | 'Lost' | 'Withdrawn'

export interface Department {
  department_id: number
  department_name: string
}

export interface Program {
  program_id: number
  degree: string
  branch_name: string
  branch_code: string | null
}

export interface LibUser {
  user_id: string
  user_type: UserType
  user_name: string
  program_id: number | null
  year: number | null
  department_id: number | null
  designation: string | null
}

export interface RfidDetail {
  uid: string
  user_id: string
}

export interface AttendanceLog {
  log_id: number
  user_id: string
  log_date: string
  login_time: string
  logout_time: string | null
  users?: { user_name: string; user_type: string; programs?: { branch_name: string } }
}

export interface LibraryBranch {
  id: number
  name: string
  location: string | null
  librarian: string | null
  created_at: string
}

export interface BookCopy {
  accession_number: string
  call_no: string | null
  book_no: string | null
  acquisition_date: string | null
  title: string
  author: string | null
  publisher: string | null
  place_of_publication: string | null
  year_of_publication: number | null
  edition: string | null
  source: string | null
  cost: number | null
  isbn: string | null
  category: string | null
  branch_id: number | null
  status: BookStatus
  created_at: string
  library_branches?: { name: string }
}

export interface BookIssue {
  id: number
  accession_number: string
  user_id: string
  issue_date: string
  due_date: string
  return_date: string | null
  fine_amount: number
  is_returned: boolean
  created_at: string
  book_copies?: { title: string; author: string | null }
  users?: { user_name: string }
}

export interface QuestionPaper {
  id: number
  subject_name: string
  subject_code: string | null
  department: string | null
  semester: number | null
  exam_type: string | null
  academic_year: string | null
  file_url: string | null
  downloads: number
  upload_date: string
  created_at: string
}

export interface Announcement {
  id: number
  text: string
  is_active: boolean
  created_at: string
}

export interface SystemSetting {
  key: string
  value: string
  updated_at: string
}
