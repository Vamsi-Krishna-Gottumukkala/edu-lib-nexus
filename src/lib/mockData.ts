// Mock data for the EduLibrary system

export interface BookCopy {
  accessionNumber: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  branch: string;
  status: "Available" | "Issued" | "Transferred" | "Lost" | "Withdrawn";
  issuedTo?: string;
  issueDate?: string;
  dueDate?: string;
}

export interface Student {
  id: string;
  name: string;
  department: string;
  semester: number;
  email: string;
  rfidCard: string;
}

export interface RFIDLog {
  id: string;
  studentId: string;
  studentName: string;
  department: string;
  entryTime: string;
  exitTime: string | null;
  date: string;
}

export interface QuestionPaper {
  id: string;
  subjectName: string;
  subjectCode: string;
  department: string;
  semester: number;
  examType: string;
  academicYear: string;
  uploadDate: string;
  downloads: number;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  totalBooks: number;
  availableBooks: number;
  librarian: string;
}

export interface TransferRecord {
  id: string;
  accessionNumber: string;
  bookTitle: string;
  fromBranch: string;
  toBranch: string;
  transferDate: string;
  status: "Completed" | "In Transit";
}

export const mockBooks: BookCopy[] = [
  { accessionNumber: "ACC1001", title: "Data Structures", author: "Mark Allen Weiss", isbn: "978-0132847377", category: "Computer Science", branch: "Main Library", status: "Available" },
  { accessionNumber: "ACC1002", title: "Data Structures", author: "Mark Allen Weiss", isbn: "978-0132847377", category: "Computer Science", branch: "Main Library", status: "Issued", issuedTo: "STU2024001", issueDate: "2026-03-01", dueDate: "2026-03-15" },
  { accessionNumber: "ACC1003", title: "Data Structures", author: "Mark Allen Weiss", isbn: "978-0132847377", category: "Computer Science", branch: "Engineering Block", status: "Available" },
  { accessionNumber: "ACC1004", title: "Operating Systems", author: "Abraham Silberschatz", isbn: "978-1119800361", category: "Computer Science", branch: "Main Library", status: "Available" },
  { accessionNumber: "ACC1005", title: "Operating Systems", author: "Abraham Silberschatz", isbn: "978-1119800361", category: "Computer Science", branch: "Main Library", status: "Lost" },
  { accessionNumber: "ACC1006", title: "Calculus", author: "James Stewart", isbn: "978-1285741550", category: "Mathematics", branch: "Science Block", status: "Available" },
  { accessionNumber: "ACC1007", title: "Organic Chemistry", author: "Paula Bruice", isbn: "978-0134042282", category: "Chemistry", branch: "Science Block", status: "Issued", issuedTo: "STU2024003", issueDate: "2026-02-20", dueDate: "2026-03-06" },
  { accessionNumber: "ACC1008", title: "Digital Logic Design", author: "Morris Mano", isbn: "978-0132774208", category: "Electronics", branch: "Engineering Block", status: "Withdrawn" },
  { accessionNumber: "ACC1009", title: "Linear Algebra", author: "Gilbert Strang", isbn: "978-0980232776", category: "Mathematics", branch: "Main Library", status: "Available" },
  { accessionNumber: "ACC1010", title: "Physics for Engineers", author: "Serway & Jewett", isbn: "978-1133947271", category: "Physics", branch: "Science Block", status: "Transferred" },
  { accessionNumber: "ACC1011", title: "Database Systems", author: "Ramez Elmasri", isbn: "978-0133970777", category: "Computer Science", branch: "Main Library", status: "Available" },
  { accessionNumber: "ACC1012", title: "Computer Networks", author: "Andrew Tanenbaum", isbn: "978-0132126953", category: "Computer Science", branch: "Engineering Block", status: "Issued", issuedTo: "STU2024002", issueDate: "2026-03-05", dueDate: "2026-03-19" },
];

export const mockStudents: Student[] = [
  { id: "STU2024001", name: "John Anderson", department: "Computer Science", semester: 5, email: "john@edu.ac.in", rfidCard: "RFID001" },
  { id: "STU2024002", name: "Emily Carter", department: "Electronics", semester: 3, email: "emily@edu.ac.in", rfidCard: "RFID002" },
  { id: "STU2024003", name: "Raj Patel", department: "Chemistry", semester: 7, email: "raj@edu.ac.in", rfidCard: "RFID003" },
  { id: "STU2024004", name: "Lisa Wong", department: "Mathematics", semester: 1, email: "lisa@edu.ac.in", rfidCard: "RFID004" },
  { id: "STU2024005", name: "Michael Brown", department: "Physics", semester: 5, email: "michael@edu.ac.in", rfidCard: "RFID005" },
];

export const mockRFIDLogs: RFIDLog[] = [
  { id: "1", studentId: "STU2024001", studentName: "John Anderson", department: "Computer Science", entryTime: "09:15", exitTime: "12:30", date: "2026-03-12" },
  { id: "2", studentId: "STU2024002", studentName: "Emily Carter", department: "Electronics", entryTime: "10:00", exitTime: "11:45", date: "2026-03-12" },
  { id: "3", studentId: "STU2024003", studentName: "Raj Patel", department: "Chemistry", entryTime: "14:00", exitTime: null, date: "2026-03-12" },
  { id: "4", studentId: "STU2024004", studentName: "Lisa Wong", department: "Mathematics", entryTime: "08:30", exitTime: "10:00", date: "2026-03-11" },
  { id: "5", studentId: "STU2024001", studentName: "John Anderson", department: "Computer Science", entryTime: "13:00", exitTime: "16:00", date: "2026-03-11" },
  { id: "6", studentId: "STU2024005", studentName: "Michael Brown", department: "Physics", entryTime: "11:00", exitTime: "13:30", date: "2026-03-10" },
];

export const mockQuestionPapers: QuestionPaper[] = [
  { id: "QP001", subjectName: "Data Structures", subjectCode: "CS301", department: "Computer Science", semester: 3, examType: "End Semester", academicYear: "2025-26", uploadDate: "2026-01-15", downloads: 245 },
  { id: "QP002", subjectName: "Operating Systems", subjectCode: "CS401", department: "Computer Science", semester: 4, examType: "Mid Semester", academicYear: "2025-26", uploadDate: "2026-01-20", downloads: 189 },
  { id: "QP003", subjectName: "Calculus II", subjectCode: "MA201", department: "Mathematics", semester: 2, examType: "End Semester", academicYear: "2024-25", uploadDate: "2025-06-10", downloads: 312 },
  { id: "QP004", subjectName: "Organic Chemistry", subjectCode: "CH301", department: "Chemistry", semester: 3, examType: "End Semester", academicYear: "2025-26", uploadDate: "2026-02-01", downloads: 156 },
  { id: "QP005", subjectName: "Digital Electronics", subjectCode: "EC201", department: "Electronics", semester: 2, examType: "Mid Semester", academicYear: "2025-26", uploadDate: "2026-02-15", downloads: 98 },
];

export const mockBranches: Branch[] = [
  { id: "BR001", name: "Main Library", location: "Central Campus", totalBooks: 5200, availableBooks: 3800, librarian: "Dr. Sarah Mitchell" },
  { id: "BR002", name: "Engineering Block", location: "Block A", totalBooks: 2100, availableBooks: 1650, librarian: "Mr. James Wilson" },
  { id: "BR003", name: "Science Block", location: "Block C", totalBooks: 1800, availableBooks: 1420, librarian: "Ms. Priya Sharma" },
];

export const mockTransfers: TransferRecord[] = [
  { id: "TR001", accessionNumber: "ACC1010", bookTitle: "Physics for Engineers", fromBranch: "Science Block", toBranch: "Engineering Block", transferDate: "2026-03-10", status: "In Transit" },
  { id: "TR002", accessionNumber: "ACC1015", bookTitle: "Circuit Analysis", fromBranch: "Engineering Block", toBranch: "Main Library", transferDate: "2026-03-08", status: "Completed" },
];

export const bookCategories = ["Computer Science", "Mathematics", "Physics", "Chemistry", "Electronics", "Mechanical", "Civil", "Literature"];
export const departments = ["Computer Science", "Electronics", "Mechanical", "Civil", "Chemistry", "Physics", "Mathematics"];
export const examTypes = ["End Semester", "Mid Semester", "Internal Assessment", "Supplementary"];
export const withdrawReasons = ["Damaged", "Sold", "Condemned", "Old Edition"];
