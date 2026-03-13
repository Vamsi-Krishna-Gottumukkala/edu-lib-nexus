import React from "react";
import { PageHeader } from "@/components/PageHeader";
import { BookOpen, DoorOpen, FileText, Library, GitBranch, BarChart3, Settings, Users, ArrowLeftRight, AlertTriangle, XCircle, Search, Upload, Download, Clock, CalendarDays, BookCopy } from "lucide-react";

const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
  <div className="bg-card rounded-xl p-6 border border-border/50 card-shadow mb-4">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h2 className="text-lg font-bold text-card-foreground">{title}</h2>
    </div>
    <div className="text-sm text-muted-foreground leading-relaxed space-y-3">{children}</div>
  </div>
);

const Step = ({ n, text }: { n: number; text: string }) => (
  <div className="flex items-start gap-3">
    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
    <p>{text}</p>
  </div>
);

const Guide = () => (
  <div className="animate-fade-in max-w-4xl">
    <PageHeader title="EduLibrary User Guide" description="Complete manual for using the EduLibrary Management System" />

    <Section icon={BookOpen} title="1. Getting Started">
      <p>Welcome to <strong>EduLibrary</strong> — a comprehensive university library management system. This guide covers every feature available to administrators and students.</p>
      <p>The system has two portals:</p>
      <ul className="list-disc ml-5 space-y-1">
        <li><strong>Admin Portal</strong> — Full control over books, inventory, branches, RFID gate register, question papers, reports, and system settings.</li>
        <li><strong>Student Portal</strong> — View-only access to issued books, due books, question papers, library visits, and personal profile.</li>
      </ul>
      <p>Use the <strong>Switch to Student/Admin View</strong> button at the bottom of the sidebar to toggle between portals.</p>
    </Section>

    <Section icon={Library} title="2. Dashboard Overview">
      <p><strong>Admin Dashboard</strong> displays key analytics cards including Total Books, Available Books, Issued Books, Lost Books, Withdrawn Books, Question Papers, and Visitors Today. Charts show book categories, monthly trends, and a recent activity feed.</p>
      <p><strong>Student Dashboard</strong> shows personal stats: Books Issued, Due Books, Library Visits, and Papers Available, along with recent personal activity.</p>
    </Section>

    <Section icon={Library} title="3. Books Inventory">
      <p>Every physical book copy is tracked by a unique <strong>Accession Number</strong> (e.g., ACC1001). A single title can have multiple copies, each with its own accession number.</p>
      <h3 className="font-semibold text-card-foreground mt-2">Inventory Overview</h3>
      <p>Navigate to <strong>Books Inventory → Books → Inventory Overview</strong> to see all books with their accession numbers, titles, authors, categories, branches, and statuses.</p>
      <h3 className="font-semibold text-card-foreground mt-2">Available Books</h3>
      <p>Shows only books with "Available" status, ready to be issued.</p>
      <h3 className="font-semibold text-card-foreground mt-2">Add Book</h3>
      <Step n={1} text="Go to Books Inventory → Books → Add Book." />
      <Step n={2} text="Fill in the Accession Number, Title, Author, ISBN, Category, and Branch." />
      <Step n={3} text="Click 'Add Book' to add the copy to inventory." />
    </Section>

    <Section icon={BookOpen} title="4. Issue Book">
      <p>Only admins can issue books to students.</p>
      <Step n={1} text="Navigate to Books Inventory → Circulation → Issue Book." />
      <Step n={2} text="Enter the Student ID in the student lookup field." />
      <Step n={3} text="Enter the Accession Number to fetch book details." />
      <Step n={4} text="Set the Issue Date and Due Date." />
      <Step n={5} text="Click 'Issue Book'. The book status changes to 'Issued'." />
    </Section>

    <Section icon={BookCopy} title="5. Return Book">
      <Step n={1} text="Navigate to Books Inventory → Circulation → Return Book." />
      <Step n={2} text="Enter the Accession Number." />
      <Step n={3} text="The system fetches the issue record and displays book and student details." />
      <Step n={4} text="The system auto-calculates the fine if the book is overdue (₹5 per day)." />
      <Step n={5} text="Click 'Return Book'. The status changes back to 'Available'." />
    </Section>

    <Section icon={ArrowLeftRight} title="6. Transfer Book">
      <p>Transfer books between library branches:</p>
      <Step n={1} text="Navigate to Books Inventory → Circulation → Transfer Book." />
      <Step n={2} text="Enter the Accession Number." />
      <Step n={3} text="Select the destination branch." />
      <Step n={4} text="Click 'Transfer'. The book's status becomes 'Transferred' in the sending branch and 'Available' in the receiving branch." />
      <p className="mt-2">All transfers are logged and visible under <strong>Branches → Branch Control → Manage Branches</strong> (Transfer History section).</p>
    </Section>

    <Section icon={AlertTriangle} title="7. Lost Books">
      <Step n={1} text="Navigate to Books Inventory → Book Status → Lost Books." />
      <Step n={2} text="Enter the Accession Number and Student ID of the responsible student." />
      <Step n={3} text="Click 'Mark as Lost'. The book status changes to 'Lost'." />
      <p className="mt-2">Lost books are recorded in the Lost Books Report under Reports.</p>
    </Section>

    <Section icon={XCircle} title="8. Withdraw Books">
      <Step n={1} text="Navigate to Books Inventory → Book Status → Withdraw Books." />
      <Step n={2} text="Enter the Accession Number." />
      <Step n={3} text="Select the reason: Damaged, Sold, Condemned, or Old Edition." />
      <Step n={4} text="Click 'Withdraw'. The book status becomes 'Withdrawn' and it no longer appears in active inventory." />
    </Section>

    <Section icon={BookCopy} title="9. Returned Books">
      <p>Navigate to <strong>Books Inventory → Book Status → Returned Books</strong> to view a complete log of all returned books, including accession numbers, return dates, and any fines collected.</p>
    </Section>

    <Section icon={DoorOpen} title="10. Gate Register (RFID System)">
      <p>The library uses RFID card scanning for entry/exit tracking.</p>
      <h3 className="font-semibold text-card-foreground mt-2">RFID Logs</h3>
      <p>Navigate to <strong>Gate Register → RFID System → RFID Logs</strong> to see all RFID scan records with Student ID, Name, Department, Entry Time, Exit Time, and Date.</p>
      <h3 className="font-semibold text-card-foreground mt-2">Registered Users</h3>
      <p>View all registered RFID card holders under <strong>Gate Register → RFID System → Registered Users</strong>.</p>
      <h3 className="font-semibold text-card-foreground mt-2">Daily Attendance</h3>
      <p>Navigate to <strong>Gate Register → Attendance → Daily Attendance</strong> to see today's library visitors.</p>
      <h3 className="font-semibold text-card-foreground mt-2">Student Visit History</h3>
      <p>View total visits and last visit date for each student under <strong>Gate Register → Attendance → Student Visit History</strong>.</p>
    </Section>

    <Section icon={FileText} title="11. Question Paper Repository">
      <h3 className="font-semibold text-card-foreground mt-2">Upload Paper (Admin Only)</h3>
      <Step n={1} text="Navigate to Question Papers → Repository → Upload Paper." />
      <Step n={2} text="Fill in: Subject Name, Subject Code, Department, Semester, Exam Type, Academic Year." />
      <Step n={3} text="Upload the PDF file." />
      <Step n={4} text="Click 'Upload Paper'." />
      <h3 className="font-semibold text-card-foreground mt-2">Question Paper Dashboard</h3>
      <p>View upload statistics, total papers, and category distribution.</p>
      <h3 className="font-semibold text-card-foreground mt-2">Student Access</h3>
      <p>Students can browse, search, and download papers from <strong>Question Bank → Browse Papers / Download Papers</strong>. Students cannot upload papers.</p>
    </Section>

    <Section icon={GitBranch} title="12. Branch Management">
      <h3 className="font-semibold text-card-foreground mt-2">Branch Overview</h3>
      <p>See all library branches with total books, available books, and librarian details.</p>
      <h3 className="font-semibold text-card-foreground mt-2">Add Branch</h3>
      <p>Create new library branches with name, location, and librarian assignment.</p>
      <h3 className="font-semibold text-card-foreground mt-2">Manage Branches</h3>
      <p>Edit branch details and view transfer history between branches.</p>
    </Section>

    <Section icon={BarChart3} title="13. Reports">
      <p>The Reports section provides comprehensive data export capabilities:</p>
      <ul className="list-disc ml-5 space-y-1">
        <li><strong>Issued Books Report</strong> — All currently issued book records with student and date details.</li>
        <li><strong>Lost Books Report</strong> — Books reported lost with estimated values.</li>
        <li><strong>Withdrawn Books Report</strong> — Books withdrawn from inventory with reasons.</li>
        <li><strong>Gate Register Report</strong> — Library entry/exit attendance data.</li>
        <li><strong>Library Visits Report</strong> — Weekly visit trends and duration analytics.</li>
      </ul>
      <p className="mt-2">All reports support <strong>Export PDF</strong> and <strong>Export Excel</strong> options.</p>
    </Section>

    <Section icon={Search} title="14. Global Search">
      <p>Use the <strong>search bar</strong> in the top header to search across the entire system. The search works live and covers:</p>
      <ul className="list-disc ml-5 space-y-1">
        <li>Book titles, authors, and accession numbers</li>
        <li>Student names and IDs</li>
        <li>Question paper subjects and codes</li>
        <li>Branch names</li>
      </ul>
      <p>Click on any search result to navigate directly to the relevant page.</p>
    </Section>

    <Section icon={Settings} title="15. System Administration">
      <h3 className="font-semibold text-card-foreground mt-2">User Management</h3>
      <p>Manage admin and student accounts. Add new users, edit details, and view role assignments.</p>
      <h3 className="font-semibold text-card-foreground mt-2">Settings</h3>
      <p>Configure system-wide settings including:</p>
      <ul className="list-disc ml-5 space-y-1">
        <li>Fine per day amount</li>
        <li>Maximum issue days</li>
        <li>Maximum books per student</li>
        <li>Library open/close times</li>
        <li>Institution name and admin email</li>
      </ul>
    </Section>

    <Section icon={Users} title="16. Student Portal Features">
      <p>Students have view-only access to the following:</p>
      <ul className="list-disc ml-5 space-y-1">
        <li><strong>My Library</strong> — View issued books and due books with fine calculation.</li>
        <li><strong>Search Books</strong> — Browse the catalog with filters for category and branch availability.</li>
        <li><strong>Question Bank</strong> — Search, preview, and download previous year question papers.</li>
        <li><strong>Library Attendance</strong> — View personal visit records and attendance history.</li>
        <li><strong>Profile</strong> — View personal details and library summary.</li>
      </ul>
      <p className="mt-2 font-semibold text-card-foreground">Students cannot: issue/return books, upload papers, manage inventory, edit branches, or access system settings.</p>
    </Section>

    <Section icon={CalendarDays} title="17. Branch Selection">
      <p>Use the <strong>branch selector</strong> dropdown in the top header bar to filter the entire dashboard view by a specific library branch. When a branch is selected, all data (books, inventory, attendance) is filtered to show only records for that branch.</p>
      <p>Select "All Branches" to view combined data across all library branches.</p>
    </Section>

    <div className="bg-primary/5 rounded-xl p-6 border border-primary/20 mt-6">
      <h2 className="text-lg font-bold text-card-foreground mb-2">Need Help?</h2>
      <p className="text-sm text-muted-foreground">For technical support or feature requests, contact the system administrator at <strong>admin@edu.ac.in</strong>. For library-related queries, visit your nearest branch librarian.</p>
    </div>
  </div>
);

export default Guide;
