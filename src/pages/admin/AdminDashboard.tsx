import React from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock, AlertTriangle, XCircle, FileText, Users, BookCopy } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { getInventoryStats } from "@/lib/services/books";
import { getTodayCount, getAttendanceLogs, getAttendanceStats } from "@/lib/services/attendance";
import { getIssuedBooks, getReturnedBooks } from "@/lib/services/issues";
import { getPapers } from "@/lib/services/papers";
import {
  Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";

const COLORS = [
  "hsl(217, 91%, 50%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)", "hsl(199, 89%, 48%)",
];

const AdminDashboard = () => {
  const { adminBranch, isSuperAdmin } = useAuth();
  const branchId = isSuperAdmin ? null : (adminBranch?.branch_id ?? null);

  const { data: stats } = useQuery({
    queryKey: ["inventory-stats", branchId],
    queryFn:  () => getInventoryStats(branchId),
  });
  const { data: todayCount = 0 } = useQuery({
    queryKey: ["today-count", branchId],
    queryFn:  () => getTodayCount(branchId),
  });
  const { data: issuedBooks = [] } = useQuery({
    queryKey: ["issued-books"],
    queryFn:  () => getIssuedBooks(),
  });
  const { data: returnedBooks = [] } = useQuery({
    queryKey: ["returned-books"],
    queryFn:  () => getReturnedBooks(10),
  });
  const { data: papers = [] } = useQuery({
    queryKey: ["papers", branchId],
    queryFn:  () => getPapers(branchId != null ? { branch_id: branchId } : undefined),
  });
  const { data: attendanceStats = [] } = useQuery({
    queryKey: ["attendance-stats", branchId],
    queryFn:  () => getAttendanceStats(branchId),
  });
  const { data: recentLogs = [] } = useQuery({
    queryKey: ["recent-logs", branchId],
    queryFn:  () => getAttendanceLogs(undefined, branchId),
  });

  // Build recent activity feed
  const recentActivity = [
    ...issuedBooks.slice(0, 3).map((issue: any) => ({
      action: "Book Issued",
      detail: `${issue.book_copies?.title || issue.accession_number} → ${issue.users?.user_name || issue.user_id}`,
      time: new Date(issue.created_at).toLocaleDateString(),
      type: "issue",
    })),
    ...returnedBooks.slice(0, 2).map((r: any) => ({
      action: "Book Returned",
      detail: `${r.book_copies?.title || r.accession_number} → ${r.users?.user_name || r.user_id}`,
      time: new Date(r.return_date).toLocaleDateString(),
      type: "return",
    })),
    ...recentLogs.slice(0, 3).map((log: any) => ({
      action: log.logout_time ? "Student Exit" : "Student Entry",
      detail: `${log.users?.user_name || log.user_id}`,
      time: `${log.log_date} ${log.login_time}`,
      type: "entry",
    })),
  ].slice(0, 8);

  // Group attendance for chart (last 7 entries)
  const chartData = attendanceStats.slice(-7);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Admin Dashboard" description="Library management overview and analytics" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Books" value={stats?.total ?? 0} icon={BookOpen} color="primary" />
        <StatsCard title="Available" value={stats?.available ?? 0} icon={BookCopy} color="success" />
        <StatsCard title="Issued" value={stats?.issued ?? 0} icon={Clock} color="info" />
        <StatsCard title="Visitors Today" value={todayCount} icon={Users} color="success" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Lost" value={stats?.lost ?? 0} icon={AlertTriangle} color="destructive" />
        <StatsCard title="Withdrawn" value={stats?.withdrawn ?? 0} icon={XCircle} color="warning" />
        <StatsCard title="Question Papers" value={papers.length} icon={FileText} color="primary" />
        <StatsCard title="Active Issues" value={issuedBooks.length} icon={Clock} color="info" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Daily Attendance (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
              <XAxis dataKey="date" fontSize={11} tickFormatter={d => d.slice(5)} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(217, 91%, 50%)" radius={[4, 4, 0, 0]} name="Visitors" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Book Inventory Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: "Available", value: stats?.available ?? 0 },
                  { name: "Issued", value: stats?.issued ?? 0 },
                  { name: "Lost", value: stats?.lost ?? 0 },
                  { name: "Withdrawn", value: stats?.withdrawn ?? 0 },
                  { name: "Transferred", value: stats?.transferred ?? 0 },
                ].filter(d => d.value > 0)}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {COLORS.map((color, i) => <Cell key={i} fill={color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow">
        <h3 className="text-sm font-semibold text-card-foreground mb-4">Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  activity.type === "issue" ? "bg-blue-500" :
                  activity.type === "return" ? "bg-green-500" :
                  "bg-indigo-500"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.detail}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
