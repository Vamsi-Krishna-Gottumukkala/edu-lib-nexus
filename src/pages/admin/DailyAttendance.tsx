import React, { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/StatsCard";
import { VisitorCharts } from "@/components/VisitorCharts";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  getTodayAttendanceLogs, getTodayCount, getTodayBranchCounts,
  manualLogout, logoutAllStudents,
} from "@/lib/services/attendance";
import {
  Users, Clock, LogOut, Wifi, UserCheck, UserX, GraduationCap, BookUser,
  Loader2, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn, fmtDate } from "@/lib/utils";

// Redundant ScanPopup removed since it's global inside RFIDContext

// ─── Main Page ────────────────────────────────────────────────
const DailyAttendance = () => {
  const queryClient = useQueryClient();
  const { adminBranch, isSuperAdmin } = useAuth();
  const branchId = isSuperAdmin ? null : (adminBranch?.branch_id ?? null);
  const [logoutingId, setLogoutingId] = useState<number | null>(null);
  const [logoutingAll, setLogoutingAll] = useState(false);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ["today-logs", branchId],
    queryFn: () => getTodayAttendanceLogs(branchId),
    refetchInterval: 30000,
  });

  const { data: todayCount = 0 } = useQuery({
    queryKey: ["today-count", branchId],
    queryFn: () => getTodayCount(branchId),
    refetchInterval: 30000,
  });

  const { data: branchCounts } = useQuery({
    queryKey: ["today-branch-counts", branchId],
    queryFn: () => getTodayBranchCounts(branchId),
    refetchInterval: 30000,
  });

  const inLibrary   = logs.filter((l: any) => !l.logout_time).length;
  const studentCount = logs.filter((l: any) => l.users?.user_type === "student").length;
  const facultyCount = logs.filter((l: any) => l.users?.user_type === "faculty").length;

  async function handleManualLogout(logId: number) {
    setLogoutingId(logId);
    try {
      await manualLogout(logId);
      queryClient.invalidateQueries({ queryKey: ["today-logs"] });
      toast.success("User logged out");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLogoutingId(null);
    }
  }

  async function handleLogoutAll() {
    setLogoutingAll(true);
    try {
      const count = await logoutAllStudents(branchId);
      queryClient.invalidateQueries({ queryKey: ["today-logs"] });
      queryClient.invalidateQueries({ queryKey: ["today-count"] });
      toast.success(`${count} student${count !== 1 ? "s" : ""} logged out`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLogoutingAll(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">

      <PageHeader
        title="Live Gate Register"
        description={`Today's library visitors — ${today}`}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
            <Wifi className="w-3 h-3 animate-pulse" />
            Live
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogoutAll}
            disabled={logoutingAll}
            className="gap-1.5"
          >
            {logoutingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
            Logout All Students
          </Button>
        </div>
      </PageHeader>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard title="Total Visitors"      value={todayCount}    icon={Users}       color="primary" />
        <StatsCard title="Currently Inside"    value={inLibrary}     icon={Clock}       color="success" />
        <StatsCard title="Student Visits"      value={studentCount}  icon={GraduationCap} color="warning" />
        <StatsCard title="Faculty Visits"      value={facultyCount}  icon={BookUser}    color="info" />
      </div>

      {/* Visitor Analytics (Pie Charts) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Visitor Analytics — Today</CardTitle>
        </CardHeader>
        <CardContent>
          {branchCounts ? (
            <VisitorCharts
              degreeMap={branchCounts.degreeMap}
              facultyMap={branchCounts.facultyMap}
            />
          ) : (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance Log Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Today's Log</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable
              columns={[
                { header: "Roll No / ID", accessor: "user_id" },
                { header: "Name", accessor: (row: any) => row.users?.user_name || "—" },
                {
                  header: "Type",
                  accessor: (row: any) => (
                    <Badge variant={row.users?.user_type === "student" ? "default" : "secondary"}>
                      {row.users?.user_type ?? "—"}
                    </Badge>
                  ),
                },
                {
                  header: "Program / Dept",
                  accessor: (row: any) =>
                    row.users?.programs?.branch_name ||
                    row.users?.departments?.department_name ||
                    "—",
                },
                { header: "Entry", accessor: "login_time" },
                {
                  header: "Exit",
                  accessor: (row: any) =>
                    row.logout_time ? (
                      row.logout_time
                    ) : (
                      <Badge variant="warning">In Library</Badge>
                    ),
                },
                {
                  header: "Action",
                  accessor: (row: any) =>
                    !row.logout_time ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                        disabled={logoutingId === row.log_id}
                        onClick={() => handleManualLogout(row.log_id)}
                      >
                        {logoutingId === row.log_id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <LogOut className="w-3 h-3" />}
                        Logout
                      </Button>
                    ) : null,
                },
              ]}
              data={logs}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyAttendance;
