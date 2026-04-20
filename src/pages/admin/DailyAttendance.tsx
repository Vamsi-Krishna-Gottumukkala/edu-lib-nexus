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

// ─── Scan Notification Card ───────────────────────────────────
interface ScanEvent {
  status: "LOGIN" | "LOGOUT" | "UNREGISTERED";
  user_name?: string;
  user_type?: string;
  branch_name?: string;
  department_name?: string;
  time?: string;
  uid?: string;
}

function ScanPopup({ event, onDismiss }: { event: ScanEvent; onDismiss: () => void }) {
  const isLogin   = event.status === "LOGIN";
  const isLogout  = event.status === "LOGOUT";
  const isUnknown = event.status === "UNREGISTERED";

  return (
    <div
      className={cn(
        "fixed top-6 right-6 z-50 w-80 rounded-xl border shadow-2xl animate-in slide-in-from-right-8 fade-in duration-300 p-4",
        isLogin   && "bg-emerald-950/90 border-emerald-500/60 backdrop-blur",
        isLogout  && "bg-amber-950/90 border-amber-500/60 backdrop-blur",
        isUnknown && "bg-red-950/90 border-red-500/60 backdrop-blur"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
          isLogin && "bg-emerald-500/20", isLogout && "bg-amber-500/20", isUnknown && "bg-red-500/20"
        )}>
          {isLogin   && <UserCheck className="w-5 h-5 text-emerald-400" />}
          {isLogout  && <LogOut    className="w-5 h-5 text-amber-400"   />}
          {isUnknown && <UserX     className="w-5 h-5 text-red-400"     />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-xs font-bold uppercase tracking-wider mb-0.5",
            isLogin && "text-emerald-400", isLogout && "text-amber-400", isUnknown && "text-red-400"
          )}>
            {isLogin ? "✅ Entry Logged" : isLogout ? "🚪 Exit Logged" : "⚠️ Unregistered Card"}
          </p>
          {isUnknown ? (
            <p className="text-sm text-red-200">UID: {event.uid}</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-white truncate">{event.user_name}</p>
              <p className="text-xs text-white/60">{event.branch_name || event.department_name || event.user_type}</p>
              {event.time && <p className="text-xs text-white/50 mt-0.5">{event.time}</p>}
            </>
          )}
        </div>
        <button onClick={onDismiss} className="text-white/40 hover:text-white/80 text-lg leading-none mt-0.5">×</button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
const DailyAttendance = () => {
  const queryClient = useQueryClient();
  const { adminBranch, isSuperAdmin } = useAuth();
  const branchId = isSuperAdmin ? null : (adminBranch?.branch_id ?? null);
  const [scanEvent, setScanEvent] = useState<ScanEvent | null>(null);
  const [logoutingId, setLogoutingId] = useState<number | null>(null);
  const [logoutingAll, setLogoutingAll] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout>>();

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

  // ─── Supabase Realtime subscription ──────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("attendance_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance_log" },
        async (payload) => {
          // Refetch queries so UI updates
          queryClient.invalidateQueries({ queryKey: ["today-logs"] });
          queryClient.invalidateQueries({ queryKey: ["today-count"] });
          queryClient.invalidateQueries({ queryKey: ["today-branch-counts"] });

          // Build scan notification
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const record = payload.new as any;
            // Fetch user details for the notification
            const { data: userRow } = await supabase
              .from("users")
              .select("user_name, user_type, programs(branch_name), departments(department_name)")
              .eq("user_id", record.user_id)
              .single();

            const event: ScanEvent = {
              status: payload.eventType === "INSERT" ? "LOGIN" : "LOGOUT",
              user_name: userRow?.user_name ?? record.user_id,
              user_type: userRow?.user_type,
              branch_name: (userRow as any)?.programs?.branch_name,
              department_name: (userRow as any)?.departments?.department_name,
              time: payload.eventType === "INSERT" ? record.login_time : record.logout_time,
            };
            showScanEvent(event);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  function showScanEvent(event: ScanEvent) {
    setScanEvent(event);
    clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => setScanEvent(null), 5000);
  }

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
      {/* Scan Notification Popup */}
      {scanEvent && (
        <ScanPopup event={scanEvent} onDismiss={() => setScanEvent(null)} />
      )}

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
