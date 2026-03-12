import React from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockBooks, mockStudents, mockRFIDLogs, mockQuestionPapers, mockBranches, mockTransfers, departments, bookCategories } from "@/lib/mockData";
import {
  History, Clock, Users, Download, Star, TrendingUp, Plus, Settings,
  Building2, BookOpen, AlertTriangle, XCircle, DoorOpen, FileText, Search,
  CalendarDays, User, Mail, BookCopy, Eye
} from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

/* ── Admin: Student Visit History ── */
export const VisitHistory = () => {
  const grouped = mockStudents.map(s => ({
    ...s,
    totalVisits: mockRFIDLogs.filter(l => l.studentId === s.id).length,
    lastVisit: mockRFIDLogs.filter(l => l.studentId === s.id).sort((a, b) => b.date.localeCompare(a.date))[0]?.date || "N/A",
  }));
  return (
    <div className="animate-fade-in">
      <PageHeader title="Student Visit History" description="Complete visit records for all students" />
      <DataTable
        columns={[
          { header: "Student ID", accessor: "id" },
          { header: "Name", accessor: "name" },
          { header: "Department", accessor: "department" },
          { header: "Total Visits", accessor: "totalVisits" },
          { header: "Last Visit", accessor: "lastVisit" },
        ]}
        data={grouped}
      />
    </div>
  );
};

/* ── Admin: Manage Papers ── */
export const ManagePapers = () => (
  <div className="animate-fade-in">
    <PageHeader title="Manage Papers" description="Edit and manage uploaded question papers">
      <Button variant="outline" size="sm" onClick={() => toast.success("Refreshed")}>Refresh</Button>
    </PageHeader>
    <DataTable
      columns={[
        { header: "Subject", accessor: "subjectName" },
        { header: "Code", accessor: "subjectCode" },
        { header: "Dept", accessor: "department" },
        { header: "Sem", accessor: "semester" },
        { header: "Exam", accessor: "examType" },
        { header: "Year", accessor: "academicYear" },
        { header: "Uploaded", accessor: "uploadDate" },
        { header: "Actions", accessor: () => (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => toast.info("Preview opened")}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toast.success("Paper deleted")} className="text-destructive hover:text-destructive">
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          </div>
        )},
      ]}
      data={mockQuestionPapers}
    />
  </div>
);

/* ── Admin: Download Analytics ── */
const downloadData = [
  { subject: "CS301", downloads: 245 },
  { subject: "MA201", downloads: 312 },
  { subject: "CS401", downloads: 189 },
  { subject: "CH301", downloads: 156 },
  { subject: "EC201", downloads: 98 },
];

export const DownloadAnalytics = () => (
  <div className="animate-fade-in">
    <PageHeader title="Download Analytics" description="Track question paper download metrics" />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <StatsCard title="Total Downloads" value={1000} icon={Download} color="primary" trend="+15% this month" trendUp />
      <StatsCard title="Papers Available" value={mockQuestionPapers.length} icon={FileText} color="info" />
      <StatsCard title="Avg Downloads/Paper" value={200} icon={TrendingUp} color="success" />
    </div>
    <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">Downloads by Subject Code</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={downloadData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
          <XAxis dataKey="subject" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip />
          <Bar dataKey="downloads" fill="hsl(217, 91%, 50%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

/* ── Admin: Subject Popularity ── */
const popularityData = [
  { subject: "Data Structures", code: "CS301", searches: 520, downloads: 245, rating: 4.8 },
  { subject: "Calculus II", code: "MA201", searches: 480, downloads: 312, rating: 4.5 },
  { subject: "Operating Systems", code: "CS401", searches: 390, downloads: 189, rating: 4.6 },
  { subject: "Organic Chemistry", code: "CH301", searches: 310, downloads: 156, rating: 4.3 },
  { subject: "Digital Electronics", code: "EC201", searches: 220, downloads: 98, rating: 4.1 },
];

export const SubjectPopularity = () => (
  <div className="animate-fade-in">
    <PageHeader title="Subject Popularity" description="Most searched and downloaded subjects" />
    <DataTable
      columns={[
        { header: "Rank", accessor: (row) => <span className="font-bold text-primary">#{popularityData.indexOf(row) + 1}</span> },
        { header: "Subject", accessor: "subject" },
        { header: "Code", accessor: "code" },
        { header: "Searches", accessor: "searches" },
        { header: "Downloads", accessor: "downloads" },
        { header: "Rating", accessor: (row) => (
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-warning fill-warning" />
            <span>{row.rating}</span>
          </div>
        )},
      ]}
      data={popularityData}
    />
  </div>
);

/* ── Admin: Add Branch ── */
export const AddBranch = () => {
  const handleAdd = () => toast.success("Branch added successfully");
  return (
    <div className="animate-fade-in">
      <PageHeader title="Add Branch" description="Add a new library branch" />
      <div className="max-w-2xl">
        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Branch Name *</Label>
              <Input placeholder="e.g. Medical Block Library" />
            </div>
            <div>
              <Label>Location *</Label>
              <Input placeholder="e.g. Block D, Floor 2" />
            </div>
            <div>
              <Label>Librarian Name</Label>
              <Input placeholder="e.g. Dr. John Smith" />
            </div>
            <div>
              <Label>Contact Email</Label>
              <Input placeholder="e.g. librarian@edu.ac.in" />
            </div>
          </div>
          <Button onClick={handleAdd} className="w-full">Add Branch</Button>
        </div>
      </div>
    </div>
  );
};

/* ── Admin: Manage Branches ── */
export const ManageBranches = () => (
  <div className="animate-fade-in">
    <PageHeader title="Manage Branches" description="Edit and manage library branches" />
    <DataTable
      columns={[
        { header: "Branch", accessor: "name" },
        { header: "Location", accessor: "location" },
        { header: "Total Books", accessor: "totalBooks" },
        { header: "Available", accessor: "availableBooks" },
        { header: "Librarian", accessor: "librarian" },
        { header: "Actions", accessor: () => (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => toast.info("Edit mode")}>
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </div>
        )},
      ]}
      data={mockBranches}
    />
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3">Transfer History</h3>
      <DataTable
        columns={[
          { header: "Accession No.", accessor: "accessionNumber" },
          { header: "Book Title", accessor: "bookTitle" },
          { header: "From", accessor: "fromBranch" },
          { header: "To", accessor: "toBranch" },
          { header: "Date", accessor: "transferDate" },
          { header: "Status", accessor: (row) => <Badge variant={row.status === "Completed" ? "success" : "info"}>{row.status}</Badge> },
        ]}
        data={mockTransfers}
      />
    </div>
  </div>
);

/* ── Admin: Report Lost ── */
export const ReportLost = () => {
  const lost = mockBooks.filter(b => b.status === "Lost");
  return (
    <div className="animate-fade-in">
      <PageHeader title="Lost Books Report" description={`${lost.length} books reported lost`}>
        <Button variant="outline" onClick={() => toast.success("Report exported")}><Download className="h-4 w-4 mr-1" /> Export PDF</Button>
      </PageHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatsCard title="Total Lost" value={lost.length} icon={AlertTriangle} color="destructive" />
        <StatsCard title="Estimated Value" value="₹2,450" icon={BookOpen} color="warning" />
      </div>
      <DataTable
        columns={[
          { header: "Accession No.", accessor: "accessionNumber" },
          { header: "Title", accessor: "title" },
          { header: "Author", accessor: "author" },
          { header: "Branch", accessor: "branch" },
          { header: "Status", accessor: () => <StatusBadge status="Lost" /> },
        ]}
        data={lost}
      />
    </div>
  );
};

/* ── Admin: Report Withdrawn ── */
export const ReportWithdrawn = () => {
  const withdrawn = mockBooks.filter(b => b.status === "Withdrawn");
  return (
    <div className="animate-fade-in">
      <PageHeader title="Withdrawn Books Report" description={`${withdrawn.length} books withdrawn from inventory`}>
        <Button variant="outline" onClick={() => toast.success("Report exported")}><Download className="h-4 w-4 mr-1" /> Export PDF</Button>
      </PageHeader>
      <DataTable
        columns={[
          { header: "Accession No.", accessor: "accessionNumber" },
          { header: "Title", accessor: "title" },
          { header: "Author", accessor: "author" },
          { header: "Category", accessor: "category" },
          { header: "Branch", accessor: "branch" },
          { header: "Status", accessor: () => <StatusBadge status="Withdrawn" /> },
        ]}
        data={withdrawn}
      />
    </div>
  );
};

/* ── Admin: Report Gate ── */
export const ReportGate = () => {
  const todayCount = mockRFIDLogs.filter(l => l.date === "2026-03-12").length;
  return (
    <div className="animate-fade-in">
      <PageHeader title="Gate Register Report" description="Library gate entry/exit attendance report">
        <Button variant="outline" onClick={() => toast.success("Report exported")}><Download className="h-4 w-4 mr-1" /> Export PDF</Button>
        <Button variant="outline" onClick={() => toast.success("Report exported")}><Download className="h-4 w-4 mr-1" /> Export Excel</Button>
      </PageHeader>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Today's Visitors" value={todayCount} icon={DoorOpen} color="primary" />
        <StatsCard title="Total Entries (Week)" value={mockRFIDLogs.length} icon={Users} color="info" />
        <StatsCard title="Avg Daily" value={Math.round(mockRFIDLogs.length / 3)} icon={TrendingUp} color="success" />
      </div>
      <DataTable
        columns={[
          { header: "Student ID", accessor: "studentId" },
          { header: "Name", accessor: "studentName" },
          { header: "Department", accessor: "department" },
          { header: "Date", accessor: "date" },
          { header: "Entry", accessor: "entryTime" },
          { header: "Exit", accessor: (row) => row.exitTime || <Badge variant="warning">In Library</Badge> },
        ]}
        data={mockRFIDLogs}
      />
    </div>
  );
};

/* ── Admin: Report Visits ── */
const visitChartData = [
  { day: "Mon", visits: 42 },
  { day: "Tue", visits: 58 },
  { day: "Wed", visits: 35 },
  { day: "Thu", visits: 61 },
  { day: "Fri", visits: 48 },
  { day: "Sat", visits: 25 },
];

export const ReportVisits = () => (
  <div className="animate-fade-in">
    <PageHeader title="Library Visits Report" description="Comprehensive visit analytics">
      <Button variant="outline" onClick={() => toast.success("Report exported")}><Download className="h-4 w-4 mr-1" /> Export PDF</Button>
    </PageHeader>
    <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow mb-6">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">Weekly Visit Trends</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={visitChartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
          <XAxis dataKey="day" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip />
          <Bar dataKey="visits" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
    <DataTable
      columns={[
        { header: "Student ID", accessor: "studentId" },
        { header: "Name", accessor: "studentName" },
        { header: "Department", accessor: "department" },
        { header: "Date", accessor: "date" },
        { header: "Duration", accessor: (row) => {
          if (!row.exitTime) return "Ongoing";
          const [eh, em] = row.entryTime.split(":").map(Number);
          const [xh, xm] = row.exitTime.split(":").map(Number);
          const mins = (xh * 60 + xm) - (eh * 60 + em);
          return `${Math.floor(mins / 60)}h ${mins % 60}m`;
        }},
      ]}
      data={mockRFIDLogs}
    />
  </div>
);

/* ── Admin: User Management ── */
export const UserManagement = () => (
  <div className="animate-fade-in">
    <PageHeader title="User Management" description="Manage admin and student accounts">
      <Button><Plus className="h-4 w-4 mr-1" /> Add User</Button>
    </PageHeader>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <StatsCard title="Total Students" value={mockStudents.length} icon={Users} color="primary" />
      <StatsCard title="Active Users" value={mockStudents.length} icon={User} color="success" />
      <StatsCard title="Admins" value={2} icon={Settings} color="info" />
    </div>
    <DataTable
      columns={[
        { header: "User ID", accessor: "id" },
        { header: "Name", accessor: "name" },
        { header: "Department", accessor: "department" },
        { header: "Semester", accessor: "semester" },
        { header: "Email", accessor: "email" },
        { header: "Role", accessor: () => <Badge variant="secondary">Student</Badge> },
        { header: "Actions", accessor: () => (
          <Button variant="ghost" size="sm" onClick={() => toast.info("Edit user")}><Settings className="h-3.5 w-3.5" /></Button>
        )},
      ]}
      data={mockStudents}
    />
  </div>
);

/* ── Admin: System Settings ── */
export const SystemSettings = () => (
  <div className="animate-fade-in">
    <PageHeader title="Settings" description="System configuration and preferences" />
    <div className="max-w-2xl space-y-6">
      <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
        <h3 className="text-sm font-semibold text-card-foreground">Library Configuration</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Fine Per Day (₹)</Label>
            <Input defaultValue="5" type="number" />
          </div>
          <div>
            <Label>Max Issue Days</Label>
            <Input defaultValue="14" type="number" />
          </div>
          <div>
            <Label>Max Books Per Student</Label>
            <Input defaultValue="3" type="number" />
          </div>
          <div>
            <Label>Library Open Time</Label>
            <Input defaultValue="08:00" type="time" />
          </div>
        </div>
        <Button onClick={() => toast.success("Settings saved")} className="w-full">Save Settings</Button>
      </div>
      <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
        <h3 className="text-sm font-semibold text-card-foreground">Institution Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Institution Name</Label>
            <Input defaultValue="EduLibrary University" />
          </div>
          <div>
            <Label>Admin Email</Label>
            <Input defaultValue="admin@edu.ac.in" />
          </div>
        </div>
        <Button onClick={() => toast.success("Details updated")} className="w-full">Update Details</Button>
      </div>
    </div>
  </div>
);

/* ═══════════════ STUDENT PAGES ═══════════════ */

/* ── Student: Issued Books ── */
export const StudentIssuedBooks = () => {
  const myBooks = mockBooks.filter(b => b.issuedTo === "STU2024001");
  return (
    <div className="animate-fade-in">
      <PageHeader title="My Issued Books" description="Books currently issued to your account" />
      <StatsCard title="Books Issued" value={myBooks.length} icon={BookOpen} color="primary" />
      <div className="mt-4">
        <DataTable
          columns={[
            { header: "Accession No.", accessor: "accessionNumber" },
            { header: "Title", accessor: "title" },
            { header: "Author", accessor: "author" },
            { header: "Issue Date", accessor: "issueDate" },
            { header: "Due Date", accessor: "dueDate" },
            { header: "Status", accessor: (row) => {
              if (row.dueDate && new Date(row.dueDate) < new Date()) return <StatusBadge status="Overdue" />;
              return <StatusBadge status="Issued" />;
            }},
          ]}
          data={myBooks}
          emptyMessage="No books currently issued"
        />
      </div>
    </div>
  );
};

/* ── Student: Due Books ── */
export const StudentDueBooks = () => {
  const myBooks = mockBooks.filter(b => b.issuedTo === "STU2024001");
  const overdue = myBooks.filter(b => b.dueDate && new Date(b.dueDate) < new Date());
  const upcoming = myBooks.filter(b => b.dueDate && new Date(b.dueDate) >= new Date());
  return (
    <div className="animate-fade-in">
      <PageHeader title="Due Books" description="Books approaching or past due date" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatsCard title="Overdue" value={overdue.length} icon={AlertTriangle} color="destructive" />
        <StatsCard title="Upcoming Due" value={upcoming.length} icon={Clock} color="warning" />
      </div>
      {overdue.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-destructive mb-3">Overdue Books</h3>
          <DataTable
            columns={[
              { header: "Accession No.", accessor: "accessionNumber" },
              { header: "Title", accessor: "title" },
              { header: "Due Date", accessor: "dueDate" },
              { header: "Days Overdue", accessor: (row) => {
                const diff = Math.ceil((new Date().getTime() - new Date(row.dueDate!).getTime()) / (1000 * 60 * 60 * 24));
                return <span className="font-semibold text-destructive">{diff} days</span>;
              }},
              { header: "Fine", accessor: (row) => {
                const diff = Math.ceil((new Date().getTime() - new Date(row.dueDate!).getTime()) / (1000 * 60 * 60 * 24));
                return <span className="font-semibold">₹{diff * 5}</span>;
              }},
            ]}
            data={overdue}
          />
        </div>
      )}
      {upcoming.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mb-3">Upcoming Due</h3>
          <DataTable
            columns={[
              { header: "Accession No.", accessor: "accessionNumber" },
              { header: "Title", accessor: "title" },
              { header: "Due Date", accessor: "dueDate" },
              { header: "Status", accessor: () => <Badge variant="info">On Time</Badge> },
            ]}
            data={upcoming}
          />
        </>
      )}
    </div>
  );
};

/* ── Student: Browse Books ── */
export const BrowseBooks = () => {
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const available = mockBooks.filter(b => b.status === "Available");
  const filtered = available.filter(b => {
    const matchesSearch = !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "all" || b.category === category;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Browse Books" description="Search and browse the library catalog" />
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by title or author..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {bookCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={[
          { header: "Accession No.", accessor: "accessionNumber" },
          { header: "Title", accessor: "title" },
          { header: "Author", accessor: "author" },
          { header: "Category", accessor: "category" },
          { header: "Branch", accessor: "branch" },
          { header: "Status", accessor: () => <StatusBadge status="Available" /> },
        ]}
        data={filtered}
        emptyMessage="No books found matching your search"
      />
    </div>
  );
};

/* ── Student: Branch Availability ── */
export const BranchAvailability = () => (
  <div className="animate-fade-in">
    <PageHeader title="Branch Availability" description="Check book availability by branch" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {mockBranches.map(branch => (
        <div key={branch.id} className="bg-card rounded-xl p-5 border border-border/50 card-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground">{branch.name}</h3>
              <p className="text-xs text-muted-foreground">{branch.location}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Books</span>
              <span className="font-medium">{branch.totalBooks}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available</span>
              <span className="font-medium text-success">{branch.availableBooks}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Issued</span>
              <span className="font-medium">{branch.totalBooks - branch.availableBooks}</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full mt-2">
              <div
                className="h-2 bg-primary rounded-full"
                style={{ width: `${(branch.availableBooks / branch.totalBooks) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">
              {Math.round((branch.availableBooks / branch.totalBooks) * 100)}% available
            </p>
          </div>
        </div>
      ))}
    </div>
    <h3 className="text-lg font-semibold mb-3">Books by Branch</h3>
    <DataTable
      columns={[
        { header: "Accession No.", accessor: "accessionNumber" },
        { header: "Title", accessor: "title" },
        { header: "Branch", accessor: "branch" },
        { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> },
      ]}
      data={mockBooks.filter(b => b.status !== "Withdrawn")}
    />
  </div>
);

/* ── Student: Browse Papers ── */
export const BrowsePapers = () => {
  const [search, setSearch] = React.useState("");
  const [dept, setDept] = React.useState("all");
  const filtered = mockQuestionPapers.filter(p => {
    const matchesSearch = !search || p.subjectName.toLowerCase().includes(search.toLowerCase()) || p.subjectCode.toLowerCase().includes(search.toLowerCase());
    const matchesDept = dept === "all" || p.department === dept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Browse Papers" description="Search question papers by subject" />
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by subject name or code..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={[
          { header: "Subject", accessor: "subjectName" },
          { header: "Code", accessor: "subjectCode" },
          { header: "Dept", accessor: "department" },
          { header: "Sem", accessor: "semester" },
          { header: "Exam", accessor: "examType" },
          { header: "Year", accessor: "academicYear" },
          { header: "Action", accessor: (row) => (
            <Button variant="ghost" size="sm" onClick={() => toast.info(`Preview: ${row.subjectName}`)}>
              <Eye className="h-3.5 w-3.5 mr-1" /> Preview
            </Button>
          )},
        ]}
        data={filtered}
        emptyMessage="No papers found"
      />
    </div>
  );
};

/* ── Student: Download Papers ── */
export const DownloadPapers = () => (
  <div className="animate-fade-in">
    <PageHeader title="Download Papers" description="Download previous year question papers" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {mockQuestionPapers.map(paper => (
        <div key={paper.id} className="bg-card rounded-xl p-5 border border-border/50 card-shadow hover:card-shadow-hover transition-shadow">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-card-foreground text-sm">{paper.subjectName}</h3>
              <p className="text-xs text-muted-foreground">{paper.subjectCode} • Sem {paper.semester}</p>
              <p className="text-xs text-muted-foreground">{paper.examType} • {paper.academicYear}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{paper.department}</Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Download className="h-3 w-3" /> {paper.downloads}
                </span>
              </div>
            </div>
          </div>
          <Button variant="outline" className="w-full mt-3" size="sm" onClick={() => toast.success(`Downloading ${paper.subjectName}...`)}>
            <Download className="h-3.5 w-3.5 mr-1" /> Download PDF
          </Button>
        </div>
      ))}
    </div>
  </div>
);

/* ── Student: My Visits ── */
export const MyVisits = () => {
  const myLogs = mockRFIDLogs.filter(l => l.studentId === "STU2024001");
  return (
    <div className="animate-fade-in">
      <PageHeader title="My Visits" description="Your library visit records" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatsCard title="Total Visits" value={myLogs.length} icon={CalendarDays} color="primary" />
        <StatsCard title="This Month" value={myLogs.filter(l => l.date.startsWith("2026-03")).length} icon={Clock} color="info" />
      </div>
      <DataTable
        columns={[
          { header: "Date", accessor: "date" },
          { header: "Entry Time", accessor: "entryTime" },
          { header: "Exit Time", accessor: (row) => row.exitTime || <Badge variant="warning">In Library</Badge> },
          { header: "Duration", accessor: (row) => {
            if (!row.exitTime) return "Ongoing";
            const [eh, em] = row.entryTime.split(":").map(Number);
            const [xh, xm] = row.exitTime.split(":").map(Number);
            const mins = (xh * 60 + xm) - (eh * 60 + em);
            return `${Math.floor(mins / 60)}h ${mins % 60}m`;
          }},
        ]}
        data={myLogs}
      />
    </div>
  );
};

/* ── Student: Attendance History ── */
export const AttendanceHistory = () => {
  const myLogs = mockRFIDLogs.filter(l => l.studentId === "STU2024001");
  const totalMinutes = myLogs.reduce((acc, l) => {
    if (!l.exitTime) return acc;
    const [eh, em] = l.entryTime.split(":").map(Number);
    const [xh, xm] = l.exitTime.split(":").map(Number);
    return acc + (xh * 60 + xm) - (eh * 60 + em);
  }, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Attendance History" description="Your complete library attendance record" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Total Visits" value={myLogs.length} icon={History} color="primary" />
        <StatsCard title="Total Hours" value={`${Math.floor(totalMinutes / 60)}h`} icon={Clock} color="info" />
        <StatsCard title="Avg Per Visit" value={`${Math.round(totalMinutes / Math.max(myLogs.length, 1))}m`} icon={TrendingUp} color="success" />
      </div>
      <DataTable
        columns={[
          { header: "Date", accessor: "date" },
          { header: "Entry", accessor: "entryTime" },
          { header: "Exit", accessor: (row) => row.exitTime || "—" },
          { header: "Duration", accessor: (row) => {
            if (!row.exitTime) return "Ongoing";
            const [eh, em] = row.entryTime.split(":").map(Number);
            const [xh, xm] = row.exitTime.split(":").map(Number);
            const mins = (xh * 60 + xm) - (eh * 60 + em);
            return `${Math.floor(mins / 60)}h ${mins % 60}m`;
          }},
        ]}
        data={myLogs}
      />
    </div>
  );
};

/* ── Student: Profile ── */
export const StudentProfile = () => {
  const student = mockStudents[0]; // John Anderson
  return (
    <div className="animate-fade-in">
      <PageHeader title="Profile" description="Your account information" />
      <div className="max-w-2xl space-y-6">
        <div className="bg-card rounded-xl p-6 border border-border/50 card-shadow">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">JA</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-card-foreground">{student.name}</h2>
              <p className="text-sm text-muted-foreground">{student.id} • {student.department}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Full Name</Label>
              <p className="text-sm font-medium">{student.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Student ID</Label>
              <p className="text-sm font-medium">{student.id}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Department</Label>
              <p className="text-sm font-medium">{student.department}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Semester</Label>
              <p className="text-sm font-medium">{student.semester}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Email</Label>
              <p className="text-sm font-medium flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {student.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">RFID Card</Label>
              <p className="text-sm font-medium">{student.rfidCard}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">Library Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{mockBooks.filter(b => b.issuedTo === student.id).length}</p>
              <p className="text-xs text-muted-foreground">Books Issued</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{mockRFIDLogs.filter(l => l.studentId === student.id).length}</p>
              <p className="text-xs text-muted-foreground">Total Visits</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">12</p>
              <p className="text-xs text-muted-foreground">Papers Downloaded</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
