import React from "react";
import { BookOpen, Clock, Users, FileText, Loader2 } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getIssuedBooks } from "@/lib/services/issues";
import { getStudentAttendanceLogs, getTodayCount } from "@/lib/services/attendance";
import { fmtDate } from "@/lib/utils";
import { getPapers } from "@/lib/services/papers";

const StudentDashboard = () => {
  const { userId, userName, studentData } = useAuth();
  const branchId = studentData?.branch_id ?? null;

  const { data: myBooks = [], isLoading: booksLoading } = useQuery({
    queryKey: ["student-issued", userId],
    queryFn: () => getIssuedBooks(userId),
    enabled: !!userId,
  });

  const { data: myLogs = [] } = useQuery({
    queryKey: ["student-logs", userId],
    queryFn: () => getStudentAttendanceLogs(userId),
    enabled: !!userId,
  });

  const { data: papers = [] } = useQuery({
    queryKey: ["papers", branchId],
    queryFn: () => getPapers(branchId != null ? { branch_id: branchId } : undefined),
  });

  const dueBooks = myBooks.filter((b: any) => b.due_date && new Date(b.due_date) < new Date());

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Student Dashboard"
        description={`Welcome back, ${userName || "Student"}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Books Issued" value={myBooks.length} icon={BookOpen} color="primary" />
        <StatsCard
          title="Due Books"
          value={dueBooks.length}
          icon={Clock}
          color={dueBooks.length > 0 ? "warning" : "success"}
        />
        <StatsCard title="Library Visits" value={myLogs.length} icon={Users} color="info" />
        <StatsCard title="Papers Available" value={papers.length} icon={FileText} color="success" />
      </div>

      {/* My Issued Books */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-foreground mb-3">My Issued Books</h3>
        {booksLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
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
                  if (row.due_date && new Date(row.due_date) < new Date()) {
                    return <StatusBadge status="Overdue" />;
                  }
                  return <StatusBadge status="Issued" />;
                },
              },
            ]}
            data={myBooks}
            emptyMessage="No books currently issued"
          />
        )}
      </div>

      {/* Recent Visits */}
      <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow">
        <h3 className="text-sm font-semibold text-card-foreground mb-4">Recent Library Visits</h3>
        {myLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No visit records yet.</p>
        ) : (
          <div className="space-y-3">
            {myLogs.slice(0, 5).map((log: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-card-foreground">
                    {log.logout_time ? "Library Visit" : "Currently In Library"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Entry: {log.login_time} {log.logout_time ? `• Exit: ${log.logout_time}` : ""}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{log.log_date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
