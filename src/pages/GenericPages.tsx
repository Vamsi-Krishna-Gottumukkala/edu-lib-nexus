import React, { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  History, Clock, Users, Download, Star, TrendingUp, Plus, Settings,
  Building2, BookOpen, AlertTriangle, XCircle, DoorOpen, FileText, Search,
  CalendarDays, User, Mail, BookCopy, Eye, Loader2, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fmtDate } from "@/lib/utils";

// Services
import { getAttendanceLogs, getStudentAttendanceLogs, getAttendanceStats } from "@/lib/services/attendance";
import { getBooks } from "@/lib/services/books";
import { getIssuedBooks } from "@/lib/services/issues";
import { getPapers, deletePaper, incrementDownload } from "@/lib/services/papers";
import { getBranches, addBranch, getBranchStats } from "@/lib/services/branches";
import { getUsers, getTotalUserCount } from "@/lib/services/users";
import { getSettings, updateSettings } from "@/lib/services/settings";

/* ── Admin: Student Visit History ── */
export const VisitHistory = () => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["visit-history"],
    queryFn: () => getVisitHistory(),
  });

  async function getVisitHistory() {
    const { supabase } = await import("@/lib/supabase");
    const { data } = await supabase
      .from("attendance_log")
      .select("user_id, log_date, users(user_name, programs(branch_name))")
      .order("log_date", { ascending: false });

    const grouped: Record<string, any> = {};
    data?.forEach((log: any) => {
      if (!grouped[log.user_id]) {
        grouped[log.user_id] = {
          user_id: log.user_id,
          user_name: log.users?.user_name || "—",
          program: log.users?.programs?.branch_name || "—",
          totalVisits: 0,
          lastVisit: log.log_date,
        };
      }
      grouped[log.user_id].totalVisits++;
    });
    return Object.values(grouped);
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Student Visit History" description="Complete visit records for all registered users" />
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <DataTable
          columns={[
            { header: "Roll No", accessor: "user_id" },
            { header: "Name", accessor: "user_name" },
            { header: "Program", accessor: "program" },
            { header: "Total Visits", accessor: "totalVisits" },
            { header: "Last Visit", accessor: "lastVisit" },
          ]}
          data={logs}
        />
      )}
    </div>
  );
};

/* ── Admin: Manage Papers ── */
export const ManagePapers = () => {
  const queryClient = useQueryClient();
  const { adminBranch, isSuperAdmin } = useAuth();
  const branchId = isSuperAdmin ? null : (adminBranch?.branch_id ?? null);

  const { data: papers = [], isLoading } = useQuery({
    queryKey: ["papers", branchId],
    queryFn: () => getPapers(branchId != null ? { branch_id: branchId } : undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePaper(id),
    onSuccess: () => {
      toast.success("Paper deleted");
      queryClient.invalidateQueries({ queryKey: ["papers"] });
    },
    onError: () => toast.error("Failed to delete"),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Manage Papers" description="Edit and delete uploaded question papers" />
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : papers.length === 0 ? (
        <div className="bg-card rounded-xl p-12 border border-border/50 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No papers uploaded yet.</p>
        </div>
      ) : (
        <DataTable
          columns={[
            { header: "Subject", accessor: "subject_name" },
            { header: "Code", accessor: (row: any) => row.subject_code || "—" },
            { header: "Dept", accessor: (row: any) => row.department || "—" },
            { header: "Sem", accessor: (row: any) => row.semester || "—" },
            { header: "Exam", accessor: (row: any) => row.exam_type || "—" },
            { header: "Year", accessor: (row: any) => row.academic_year || "—" },
            { header: "Downloads", accessor: "downloads" },
            {
              header: "Actions",
              accessor: (row: any) => (
                <div className="flex gap-1">
                  {row.file_url && (
                    <Button variant="ghost" size="sm" onClick={() => window.open(row.file_url, "_blank")}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost" size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(row.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ),
            },
          ]}
          data={papers}
        />
      )}
    </div>
  );
};

/* ── Admin: Download Analytics ── */
export const DownloadAnalytics = () => {
  const { adminBranch, isSuperAdmin } = useAuth();
  const branchId = isSuperAdmin ? null : (adminBranch?.branch_id ?? null);

  const { data: papers = [] } = useQuery({
    queryKey: ["papers", branchId],
    queryFn: () => getPapers(branchId != null ? { branch_id: branchId } : undefined),
  });

  const totalDownloads = papers.reduce((a: number, p: any) => a + (p.downloads || 0), 0);
  const avgDownloads = papers.length > 0 ? Math.round(totalDownloads / papers.length) : 0;

  const chartData = papers
    .filter((p: any) => p.subject_code)
    .sort((a: any, b: any) => (b.downloads || 0) - (a.downloads || 0))
    .slice(0, 10)
    .map((p: any) => ({ subject: p.subject_code, downloads: p.downloads || 0 }));

  return (
    <div className="animate-fade-in">
      <PageHeader title="Download Analytics" description="Track question paper download metrics" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Total Downloads" value={totalDownloads} icon={Download} color="primary" />
        <StatsCard title="Papers Available" value={papers.length} icon={FileText} color="info" />
        <StatsCard title="Avg Downloads/Paper" value={avgDownloads} icon={TrendingUp} color="success" />
      </div>
      {chartData.length > 0 && (
        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Top 10 Most Downloaded Papers</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
              <XAxis dataKey="subject" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="downloads" fill="hsl(217, 91%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

/* ── Admin: Subject Popularity ── */
export const SubjectPopularity = () => {
  const { adminBranch, isSuperAdmin } = useAuth();
  const branchId = isSuperAdmin ? null : (adminBranch?.branch_id ?? null);

  const { data: papers = [] } = useQuery({
    queryKey: ["papers", branchId],
    queryFn: () => getPapers(branchId != null ? { branch_id: branchId } : undefined),
  });

  const sorted = [...papers].sort((a: any, b: any) => (b.downloads || 0) - (a.downloads || 0));

  return (
    <div className="animate-fade-in">
      <PageHeader title="Subject Popularity" description="Most downloaded question papers" />
      <DataTable
        columns={[
          { header: "Rank", accessor: (_row: any, idx: number) => <span className="font-bold text-primary">#{idx + 1}</span> },
          { header: "Subject", accessor: "subject_name" },
          { header: "Code", accessor: (row: any) => row.subject_code || "—" },
          { header: "Department", accessor: (row: any) => row.department || "—" },
          { header: "Downloads", accessor: "downloads" },
        ]}
        data={sorted}
      />
    </div>
  );
};

/* ── Admin: Add Branch ── */
export const AddBranch = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", location: "", librarian: "" });

  const addMutation = useMutation({
    mutationFn: () => addBranch(form),
    onSuccess: () => {
      toast.success("Branch added successfully");
      setForm({ name: "", location: "", librarian: "" });
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["branch-stats"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to add branch"),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Add Branch" description="Add a new library branch" />
      <div className="max-w-2xl">
        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Branch Name *</Label>
              <Input placeholder="e.g. Central Library" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Location</Label>
              <Input placeholder="e.g. Main Block, Floor 1" value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div>
              <Label>Librarian Name</Label>
              <Input placeholder="e.g. Dr. Lakshmi Prasad" value={form.librarian}
                onChange={e => setForm(f => ({ ...f, librarian: e.target.value }))} />
            </div>
          </div>
          <Button onClick={() => addMutation.mutate()} className="w-full" disabled={!form.name || addMutation.isPending}>
            {addMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Adding...</> : "Add Branch"}
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ── Admin: Manage Branches ── */
export const ManageBranches = () => {
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["branch-stats"],
    queryFn: getBranchStats,
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Manage Branches" description="Library branches and their statistics" />
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : branches.length === 0 ? (
        <div className="bg-card rounded-xl p-12 border border-border/50 text-center">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No branches yet. Add a branch first.</p>
        </div>
      ) : (
        <DataTable
          columns={[
            { header: "Branch", accessor: "name" },
            { header: "Location", accessor: (row: any) => row.location || "—" },
            { header: "Total Books", accessor: "total" },
            { header: "Available", accessor: "available" },
            { header: "Issued", accessor: "issued" },
            { header: "Librarian", accessor: (row: any) => row.librarian || "—" },
          ]}
          data={branches}
        />
      )}
    </div>
  );
};

/* ── Admin: Report Lost ── */
export const ReportLost = () => {
  const { data: lost = [], isLoading } = useQuery({
    queryKey: ["books", "lost"],
    queryFn: () => getBooks({ status: "Lost" }),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Lost Books Report" description={`${lost.length} books reported lost`}>
        <Button variant="outline" onClick={() => toast.info("Export coming soon")}>
          <Download className="h-4 w-4 mr-1" /> Export
        </Button>
      </PageHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatsCard title="Total Lost" value={lost.length} icon={AlertTriangle} color="destructive" />
        <StatsCard title="Est. Value" value={`₹${lost.reduce((a: number, b: any) => a + (b.cost || 0), 0).toLocaleString()}`} icon={BookOpen} color="warning" />
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <DataTable
          columns={[
            { header: "Accession No.", accessor: "accession_number" },
            { header: "Title", accessor: "title" },
            { header: "Author", accessor: (row: any) => row.author || "—" },
            { header: "Branch", accessor: (row: any) => row.library_branches?.name || "—" },
            { header: "Status", accessor: () => <StatusBadge status="Lost" /> },
          ]}
          data={lost}
        />
      )}
    </div>
  );
};

/* ── Admin: Report Withdrawn ── */
export const ReportWithdrawn = () => {
  const { data: withdrawn = [], isLoading } = useQuery({
    queryKey: ["books", "withdrawn"],
    queryFn: () => getBooks({ status: "Withdrawn" }),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Withdrawn Books Report" description={`${withdrawn.length} books withdrawn`}>
        <Button variant="outline" onClick={() => toast.info("Export coming soon")}>
          <Download className="h-4 w-4 mr-1" /> Export
        </Button>
      </PageHeader>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <DataTable
          columns={[
            { header: "Accession No.", accessor: "accession_number" },
            { header: "Title", accessor: "title" },
            { header: "Author", accessor: (row: any) => row.author || "—" },
            { header: "Branch", accessor: (row: any) => row.library_branches?.name || "—" },
            { header: "Status", accessor: () => <StatusBadge status="Withdrawn" /> },
          ]}
          data={withdrawn}
        />
      )}
    </div>
  );
};

/* ── Admin: Report Gate ── */
export const ReportGate = () => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["rfid-logs"],
    queryFn: () => getAttendanceLogs(),
  });
  const today = new Date().toISOString().split("T")[0];
  const todayCount = logs.filter((l: any) => l.log_date === today).length;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Gate Register Report" description="Library gate entry/exit attendance report">
        <Button variant="outline" onClick={() => toast.info("Export coming soon")}>
          <Download className="h-4 w-4 mr-1" /> Export
        </Button>
      </PageHeader>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Today's Visitors" value={todayCount} icon={DoorOpen} color="primary" />
        <StatsCard title="Total Records" value={logs.length} icon={Users} color="info" />
        <StatsCard title="Currently In" value={logs.filter((l: any) => !l.logout_time && l.log_date === today).length} icon={Clock} color="success" />
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <DataTable
          columns={[
            { header: "Roll No", accessor: "user_id" },
            { header: "Name", accessor: (row: any) => row.users?.user_name || "—" },
            { header: "Program", accessor: (row: any) => row.users?.programs?.branch_name || "—" },
            { header: "Date", accessor: (row: any) => fmtDate(row.log_date) },
            { header: "Entry", accessor: "login_time" },
            { header: "Exit", accessor: (row: any) => row.logout_time || <Badge variant="warning">In Library</Badge> },
          ]}
          data={logs}
        />
      )}
    </div>
  );
};

/* ── Admin: Report Visits ── */
export const ReportVisits = () => {
  const { adminBranch, isSuperAdmin } = useAuth();
  const branchId = isSuperAdmin ? null : (adminBranch?.branch_id ?? null);
  const { data: stats = [] } = useQuery({
    queryKey: ["attendance-stats", branchId],
    queryFn:  () => getAttendanceStats(branchId),
  });
  const { data: logs = [] } = useQuery({
    queryKey: ["rfid-logs", branchId],
    queryFn:  () => getAttendanceLogs(undefined, branchId),
  });

  const chartData = stats.slice(-14);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Library Visits Report" description="Comprehensive visit analytics">
        <Button variant="outline" onClick={() => toast.info("Export coming soon")}>
          <Download className="h-4 w-4 mr-1" /> Export
        </Button>
      </PageHeader>
      <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow mb-6">
        <h3 className="text-sm font-semibold text-card-foreground mb-4">Daily Visits (Last 14 Days)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
            <XAxis dataKey="date" fontSize={11} tickFormatter={(d: string) => d.slice(5)} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} name="Visitors" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTable
        columns={[
          { header: "Roll No", accessor: "user_id" },
          { header: "Name", accessor: (row: any) => row.users?.user_name || "—" },
          { header: "Date", accessor: (row: any) => fmtDate(row.log_date) },
          { header: "Entry", accessor: "login_time" },
          {
            header: "Duration",
            accessor: (row: any) => {
              if (!row.logout_time) return "Ongoing";
              const [eh, em] = row.login_time.split(":").map(Number);
              const [xh, xm] = row.logout_time.split(":").map(Number);
              const mins = (xh * 60 + xm) - (eh * 60 + em);
              return mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : "< 1m";
            },
          },
        ]}
        data={logs}
      />
    </div>
  );
};

/* ── Admin: User Management ── */
export const UserManagement = () => {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(),
  });
  const { data: count = 0 } = useQuery({
    queryKey: ["user-count"],
    queryFn:  () => getTotalUserCount(),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="User Management" description="Registered students and faculty">
      </PageHeader>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Total Users" value={count} icon={Users} color="primary" />
        <StatsCard title="Students" value={users.filter((u: any) => u.user_type === "student").length} icon={User} color="success" />
        <StatsCard title="Faculty" value={users.filter((u: any) => u.user_type === "faculty").length} icon={Settings} color="info" />
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <DataTable
          columns={[
            { header: "Roll No / ID", accessor: "user_id" },
            { header: "Name", accessor: "user_name" },
            { header: "Type", accessor: (row: any) => <Badge variant={row.user_type === "student" ? "default" : "secondary"}>{row.user_type}</Badge> },
            { header: "Program", accessor: (row: any) => row.programs?.branch_name || "—" },
            { header: "Year", accessor: (row: any) => row.year ? `Year ${row.year}` : "—" },
          ]}
          data={users}
        />
      )}
    </div>
  );
};

/* ── Admin: System Settings ── */
export const SystemSettings = () => {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const [form, setForm] = useState<Record<string, string>>({});

  // Initialize form from settings
  React.useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, string>) => updateSettings(data),
    onSuccess: () => {
      toast.success("Settings saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const upd = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="animate-fade-in">
      <PageHeader title="Settings" description="System configuration and preferences" />
      <div className="max-w-2xl space-y-6">
        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
          <h3 className="text-sm font-semibold text-card-foreground">Library Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fine Per Day (₹)</Label>
              <Input type="number" value={form.fine_per_day || ""} onChange={e => upd("fine_per_day", e.target.value)} />
            </div>
            <div>
              <Label>Max Issue Days</Label>
              <Input type="number" value={form.max_issue_days || ""} onChange={e => upd("max_issue_days", e.target.value)} />
            </div>
            <div>
              <Label>Max Books Per Student</Label>
              <Input type="number" value={form.max_books_per_student || ""} onChange={e => upd("max_books_per_student", e.target.value)} />
            </div>
            <div>
              <Label>Library Open Time</Label>
              <Input type="time" value={form.library_open_time || ""} onChange={e => upd("library_open_time", e.target.value)} />
            </div>
            <div>
              <Label>Library Close Time</Label>
              <Input type="time" value={form.library_close_time || ""} onChange={e => upd("library_close_time", e.target.value)} />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
          <h3 className="text-sm font-semibold text-card-foreground">Institution Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Institution Name</Label>
              <Input value={form.institution_name || ""} onChange={e => upd("institution_name", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Admin Email</Label>
              <Input value={form.admin_email || ""} onChange={e => upd("admin_email", e.target.value)} />
            </div>
          </div>
        </div>
        <Button onClick={() => updateMutation.mutate(form)} className="w-full" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : "Save All Settings"}
        </Button>
      </div>
    </div>
  );
};

/* ═══════════════ STUDENT PAGES ═══════════════ */

/* ── Student: Issued Books ── */
export const StudentIssuedBooks = () => {
  const { userId } = useAuth();
  const { data: myBooks = [], isLoading } = useQuery({
    queryKey: ["student-issued", userId],
    queryFn: () => getIssuedBooks(userId),
    enabled: !!userId,
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="My Issued Books" description="Books currently issued to your account" />
      <StatsCard title="Books Issued" value={myBooks.length} icon={BookOpen} color="primary" />
      <div className="mt-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <DataTable
            columns={[
              { header: "Accession No.", accessor: "accession_number" },
              { header: "Title", accessor: (row: any) => row.book_copies?.title || "—" },
              { header: "Author", accessor: (row: any) => row.book_copies?.author || "—" },
              { header: "Issue Date", accessor: (row: any) => fmtDate(row.issue_date) },
              { header: "Due Date", accessor: (row: any) => fmtDate(row.due_date) },
              {
                header: "Status",
                accessor: (row: any) => {
                  if (new Date(row.due_date) < new Date()) return <StatusBadge status="Overdue" />;
                  return <StatusBadge status="Issued" />;
                },
              },
            ]}
            data={myBooks}
            emptyMessage="No books currently issued"
          />
        )}
      </div>
    </div>
  );
};

/* ── Student: Due Books ── */
export const StudentDueBooks = () => {
  const { userId } = useAuth();
  const { data: myBooks = [], isLoading } = useQuery({
    queryKey: ["student-issued", userId],
    queryFn: () => getIssuedBooks(userId),
    enabled: !!userId,
  });

  const overdue = myBooks.filter((b: any) => b.due_date && new Date(b.due_date) < new Date());
  const upcoming = myBooks.filter((b: any) => b.due_date && new Date(b.due_date) >= new Date());

  return (
    <div className="animate-fade-in">
      <PageHeader title="Due Books" description="Books approaching or past due date" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatsCard title="Overdue" value={overdue.length} icon={AlertTriangle} color="destructive" />
        <StatsCard title="Upcoming Due" value={upcoming.length} icon={Clock} color="warning" />
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <>
          {overdue.length > 0 && (
            <div className="mb-6">
              <h3 className="text-base font-semibold text-destructive mb-3">Overdue Books</h3>
              <DataTable
                columns={[
                  { header: "Title", accessor: (row: any) => row.book_copies?.title || row.accession_number },
                  { header: "Due Date", accessor: (row: any) => fmtDate(row.due_date) },
                  {
                    header: "Days Overdue",
                    accessor: (row: any) => {
                      const diff = Math.ceil((new Date().getTime() - new Date(row.due_date).getTime()) / (1000 * 60 * 60 * 24));
                      return <span className="font-semibold text-destructive">{diff} days</span>;
                    },
                  },
                  {
                    header: "Fine",
                    accessor: (row: any) => {
                      const diff = Math.ceil((new Date().getTime() - new Date(row.due_date).getTime()) / (1000 * 60 * 60 * 24));
                      return <span className="font-semibold">₹{diff * 5}</span>;
                    },
                  },
                ]}
                data={overdue}
              />
            </div>
          )}
          {upcoming.length > 0 && (
            <DataTable
              columns={[
                { header: "Title", accessor: (row: any) => row.book_copies?.title || row.accession_number },
                { header: "Due Date", accessor: (row: any) => fmtDate(row.due_date) },
                { header: "Status", accessor: () => <Badge variant="info">On Time</Badge> },
              ]}
              data={upcoming}
            />
          )}
          {myBooks.length === 0 && (
            <div className="bg-card rounded-xl p-12 border border-border/50 text-center">
              <p className="text-muted-foreground">No books currently issued.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ── Student: Browse Books ── */
export const BrowseBooks = () => {
  const [search, setSearch] = useState("");

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books", "available", search],
    queryFn: () => getBooks({
      status: "Available",
      search: search || undefined,
    }),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Browse Books" description="Search and browse the library catalog" />
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by title, author, accession no., or ISBN..." className="pl-9"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <DataTable
          columns={[
            { header: "Accession No.", accessor: "accession_number" },
            { header: "Call No.", accessor: (row: any) => row.call_no || "—" },
            { header: "Title", accessor: "title" },
            { header: "Author", accessor: (row: any) => row.author || "—" },
            { header: "Publisher", accessor: (row: any) => row.publisher || "—" },
            { header: "Year", accessor: (row: any) => row.year_of_publication || "—" },
            { header: "Branch", accessor: (row: any) => row.library_branches?.name || "—" },
            { header: "Status", accessor: () => <StatusBadge status="Available" /> },
          ]}
          data={books}
          emptyMessage="No books found"
        />
      )}
    </div>
  );
};

/* ── Student: Branch Availability ── */
export const BranchAvailability = () => {
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["branch-stats"],
    queryFn: getBranchStats,
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Branch Availability" description="Check book availability by branch" />
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : branches.length === 0 ? (
        <div className="bg-card rounded-xl p-12 border border-border/50 text-center">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No branches configured yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(branches as any[]).map((branch: any) => (
            <div key={branch.id} className="bg-card rounded-xl p-5 border border-border/50 card-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">{branch.name}</h3>
                  <p className="text-xs text-muted-foreground">{branch.location || "—"}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Books</span>
                  <span className="font-medium">{branch.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available</span>
                  <span className="font-medium text-green-600">{branch.available}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Issued</span>
                  <span className="font-medium">{branch.issued}</span>
                </div>
                {branch.total > 0 && (
                  <>
                    <div className="w-full h-2 bg-muted rounded-full mt-2">
                      <div className="h-2 bg-primary rounded-full"
                        style={{ width: `${(branch.available / branch.total) * 100}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      {Math.round((branch.available / branch.total) * 100)}% available
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Student: Browse Papers ── */
export const BrowsePapers = () => {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("all");
  const { studentData } = useAuth();
  const branchId = studentData?.branch_id ?? null;

  const { data: papers = [], isLoading } = useQuery({
    queryKey: ["papers", search, dept, branchId],
    queryFn: () => getPapers({
      search: search || undefined,
      department: dept !== "all" ? dept : undefined,
      branch_id: branchId,
    }),
  });

  const departments = [...new Set(papers.map((p: any) => p.department).filter(Boolean))];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Browse Papers" description="Search question papers by subject" />
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by subject name or code..." className="pl-9"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d: any) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <DataTable
          columns={[
            { header: "Subject", accessor: "subject_name" },
            { header: "Code", accessor: (row: any) => row.subject_code || "—" },
            { header: "Dept", accessor: (row: any) => row.department || "—" },
            { header: "Sem", accessor: (row: any) => row.semester || "—" },
            { header: "Exam", accessor: (row: any) => row.exam_type || "—" },
            { header: "Year", accessor: (row: any) => row.academic_year || "—" },
            {
              header: "Action",
              accessor: (row: any) => row.file_url ? (
                <Button variant="ghost" size="sm" onClick={() => window.open(row.file_url, "_blank")}>
                  <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                </Button>
              ) : <span className="text-muted-foreground text-xs">No file</span>,
            },
          ]}
          data={papers}
          emptyMessage="No papers found"
        />
      )}
    </div>
  );
};

/* ── Student: Download Papers ── */
export const DownloadPapers = () => {
  const queryClient = useQueryClient();
  const { studentData } = useAuth();
  const branchId = studentData?.branch_id ?? null;

  const { data: papers = [], isLoading } = useQuery({
    queryKey: ["papers", branchId],
    queryFn: () => getPapers(branchId != null ? { branch_id: branchId } : undefined),
  });

  const handleDownload = async (paper: any) => {
    if (!paper.file_url) { toast.error("No file available"); return; }
    window.open(paper.file_url, "_blank");
    await incrementDownload(paper.id);
    queryClient.invalidateQueries({ queryKey: ["papers"] });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Download Papers" description="Download previous year question papers" />
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : papers.length === 0 ? (
        <div className="bg-card rounded-xl p-12 border border-border/50 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No question papers uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.map((paper: any) => (
            <div key={paper.id} className="bg-card rounded-xl p-5 border border-border/50 card-shadow hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-card-foreground text-sm">{paper.subject_name}</h3>
                  <p className="text-xs text-muted-foreground">{paper.subject_code || "—"} • Sem {paper.semester || "—"}</p>
                  <p className="text-xs text-muted-foreground">{paper.exam_type || "—"} • {paper.academic_year || "—"}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {paper.department && <Badge variant="secondary">{paper.department}</Badge>}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Download className="h-3 w-3" /> {paper.downloads}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline" className="w-full mt-3" size="sm"
                onClick={() => handleDownload(paper)}
                disabled={!paper.file_url}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                {paper.file_url ? "Download PDF" : "No File"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Student: My Visits ── */
export const MyVisits = () => {
  const { userId } = useAuth();
  const { data: myLogs = [], isLoading } = useQuery({
    queryKey: ["student-logs", userId],
    queryFn: () => getStudentAttendanceLogs(userId),
    enabled: !!userId,
  });

  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthCount = myLogs.filter((l: any) => l.log_date.startsWith(thisMonth)).length;

  return (
    <div className="animate-fade-in">
      <PageHeader title="My Visits" description="Your library visit records" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatsCard title="Total Visits" value={myLogs.length} icon={CalendarDays} color="primary" />
        <StatsCard title="This Month" value={thisMonthCount} icon={Clock} color="info" />
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <DataTable
          columns={[
            { header: "Date", accessor: (row: any) => fmtDate(row.log_date) },
            { header: "Entry Time", accessor: "login_time" },
            { header: "Exit Time", accessor: (row: any) => row.logout_time || <Badge variant="warning">In Library</Badge> },
            {
              header: "Duration",
              accessor: (row: any) => {
                if (!row.logout_time) return "Ongoing";
                const [eh, em] = row.login_time.split(":").map(Number);
                const [xh, xm] = row.logout_time.split(":").map(Number);
                const mins = (xh * 60 + xm) - (eh * 60 + em);
                return mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : "< 1m";
              },
            },
          ]}
          data={myLogs}
          emptyMessage="No visit records found"
        />
      )}
    </div>
  );
};

/* ── Student: Attendance History ── */
export const AttendanceHistory = () => {
  const { userId } = useAuth();
  const { data: myLogs = [] } = useQuery({
    queryKey: ["student-logs", userId],
    queryFn: () => getStudentAttendanceLogs(userId),
    enabled: !!userId,
  });

  const totalMinutes = myLogs.reduce((acc: number, l: any) => {
    if (!l.logout_time) return acc;
    const [eh, em] = l.login_time.split(":").map(Number);
    const [xh, xm] = l.logout_time.split(":").map(Number);
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
          { header: "Date", accessor: (row: any) => fmtDate(row.log_date) },
          { header: "Entry", accessor: "login_time" },
          { header: "Exit", accessor: (row: any) => row.logout_time || "—" },
          {
            header: "Duration",
            accessor: (row: any) => {
              if (!row.logout_time) return "Ongoing";
              const [eh, em] = row.login_time.split(":").map(Number);
              const [xh, xm] = row.logout_time.split(":").map(Number);
              const mins = (xh * 60 + xm) - (eh * 60 + em);
              return mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : "< 1m";
            },
          },
        ]}
        data={myLogs}
      />
    </div>
  );
};

/* ── Student: Profile ── */
export const StudentProfile = () => {
  const { userId, userName, studentData } = useAuth();
  const { data: myBooks = [] } = useQuery({
    queryKey: ["student-issued", userId],
    queryFn: () => getIssuedBooks(userId),
    enabled: !!userId,
  });
  const { data: myLogs = [] } = useQuery({
    queryKey: ["student-logs", userId],
    queryFn: () => getStudentAttendanceLogs(userId),
    enabled: !!userId,
  });

  const initials = userName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="animate-fade-in">
      <PageHeader title="Profile" description="Your library account information" />
      <div className="max-w-2xl space-y-6">
        <div className="bg-card rounded-xl p-6 border border-border/50 card-shadow">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">{initials}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-card-foreground">{userName}</h2>
              <p className="text-sm text-muted-foreground">{userId}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Full Name</Label>
              <p className="text-sm font-medium">{userName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Roll Number</Label>
              <p className="text-sm font-medium">{userId}</p>
            </div>
            {studentData?.program_id && (
              <div>
                <Label className="text-muted-foreground text-xs">Year</Label>
                <p className="text-sm font-medium">{studentData.year ? `Year ${studentData.year}` : "—"}</p>
              </div>
            )}
          </div>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">Library Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{myBooks.length}</p>
              <p className="text-xs text-muted-foreground">Books Issued</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{myLogs.length}</p>
              <p className="text-xs text-muted-foreground">Total Visits</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
