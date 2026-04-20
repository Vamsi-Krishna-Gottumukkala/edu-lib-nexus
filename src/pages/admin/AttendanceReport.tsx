import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import { getAttendanceReport } from "@/lib/services/attendance";
import { getPrograms, getDepartments } from "@/lib/services/catalog";
import { FileDown, Search, Loader2, Filter } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { fmtDate } from "@/lib/utils";

type UserType = "student" | "faculty";

export default function AttendanceReport() {
  const [userType, setUserType] = useState<UserType>("student");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [fetchParams, setFetchParams] = useState<null | {
    userType: UserType; startDate: string; endDate: string;
    branches: string[]; departments: string[];
  }>(null);

  const { data: programs = [] } = useQuery({ queryKey: ["programs"], queryFn: getPrograms });
  const { data: departments = [] } = useQuery({ queryKey: ["departments"], queryFn: getDepartments });

  const { data: reportData = [], isLoading } = useQuery({
    queryKey: ["attendance-report", fetchParams],
    queryFn: () => fetchParams ? getAttendanceReport({
      userType: fetchParams.userType,
      startDate: fetchParams.startDate,
      endDate: fetchParams.endDate,
      branches: fetchParams.branches,
      departments: fetchParams.departments,
    }) : Promise.resolve([]),
    enabled: !!fetchParams,
  });

  function toggleBranch(code: string) {
    setSelectedBranches(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  }
  function toggleDept(name: string) {
    setSelectedDepts(prev => prev.includes(name) ? prev.filter(d => d !== name) : [...prev, name]);
  }

  function handlePreview() {
    setFetchParams({ userType, startDate, endDate, branches: selectedBranches, departments: selectedDepts });
  }

  function handleDownload() {
    if (reportData.length === 0) { toast.error("No data to download"); return; }
    const rows = (reportData as any[]).map(r => ({
      "Roll No / ID": r.user_id,
      "Name": r.users?.user_name ?? "—",
      "Branch / Dept": userType === "student"
        ? (r.users?.programs?.branch_name ?? "—")
        : (r.users?.departments?.department_name ?? "—"),
      "Date": r.log_date,
      "Entry Time": r.login_time,
      "Exit Time": r.logout_time ?? "Still Inside",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `Attendance_${userType}_${startDate}_to_${endDate}.xlsx`);
    toast.success("Excel downloaded!");
  }

  // Branch multi-select chips grouped by degree
  const degreeGroups = programs.reduce<Record<string, typeof programs>>((acc, p: any) => {
    if (!acc[p.degree]) acc[p.degree] = [];
    acc[p.degree].push(p);
    return acc;
  }, {});

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Attendance Report" description="Generate and download filtered attendance records" />

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Filter className="w-4 h-4" /> Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User type toggle */}
          <div className="flex gap-2">
            {(["student", "faculty"] as const).map(t => (
              <Button
                key={t}
                variant={userType === t ? "default" : "outline"}
                size="sm"
                onClick={() => { setUserType(t); setSelectedBranches([]); setSelectedDepts([]); }}
                className="capitalize"
              >
                {t}
              </Button>
            ))}
          </div>

          {/* Date range */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground w-14">From</label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-40 h-8 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground w-14">To</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-40 h-8 text-sm" />
            </div>
          </div>

          {/* Branch / Dept filter */}
          {userType === "student" ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Filter by branch (leave empty = all)</p>
              {Object.entries(degreeGroups).map(([degree, progs]) => (
                <div key={degree} className="space-y-1">
                  <p className="text-xs font-semibold text-foreground/60">{degree}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(progs as any[]).map((p: any) => (
                      <button
                        key={p.branch_code}
                        onClick={() => toggleBranch(p.branch_code)}
                        className={`px-2.5 py-0.5 rounded-full text-xs border transition-colors ${
                          selectedBranches.includes(p.branch_code)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-transparent text-muted-foreground border-border hover:border-primary/60"
                        }`}
                      >
                        {p.branch_code}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Filter by department (leave empty = all)</p>
              <div className="flex flex-wrap gap-1.5">
                {(departments as any[]).map((d: any) => (
                  <button
                    key={d.department_name}
                    onClick={() => toggleDept(d.department_name)}
                    className={`px-2.5 py-0.5 rounded-full text-xs border transition-colors ${
                      selectedDepts.includes(d.department_name)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-transparent text-muted-foreground border-border hover:border-primary/60"
                    }`}
                  >
                    {d.department_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button size="sm" className="gap-1.5" onClick={handlePreview}>
              <Search className="w-3.5 h-3.5" /> Preview Report
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleDownload} disabled={reportData.length === 0}>
              <FileDown className="w-3.5 h-3.5" /> Download Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {fetchParams && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Results — {reportData.length} records</span>
              {reportData.length > 0 && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={handleDownload}>
                  <FileDown className="w-3.5 h-3.5" /> Download Excel
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <DataTable
                columns={[
                  { header: "Roll No / ID", accessor: "user_id" },
                  { header: "Name", accessor: (r: any) => r.users?.user_name ?? "—" },
                  {
                    header: userType === "student" ? "Branch" : "Department",
                    accessor: (r: any) => userType === "student"
                      ? r.users?.programs?.branch_name ?? "—"
                      : r.users?.departments?.department_name ?? "—",
                  },
                  { header: "Date", accessor: (r: any) => fmtDate(r.log_date) },
                  { header: "Entry", accessor: "login_time" },
                  {
                    header: "Exit",
                    accessor: (r: any) => r.logout_time ?? <Badge variant="warning">Still Inside</Badge>,
                  },
                ]}
                data={reportData}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
