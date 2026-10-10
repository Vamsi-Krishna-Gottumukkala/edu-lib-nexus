import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { DataTable } from "@/components/DataTable";
import { getCirculationReport } from "@/lib/services/issues";
import { getPrograms, getDepartments } from "@/lib/services/catalog";
import { FileDown, Search, Loader2, Filter } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { fmtDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

type UserType = "student" | "faculty" | "all";

export default function ReportReturned() {
  const [userType, setUserType] = useState<UserType>("all");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
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

  const { adminBranch, isSuperAdmin } = useAuth();
  const branchId = isSuperAdmin ? null : (adminBranch?.branch_id ?? null);
  const { data: programs = [] } = useQuery({ queryKey: ["programs", branchId], queryFn: () => getPrograms(branchId) });
  const { data: departments = [] } = useQuery({ queryKey: ["departments", branchId], queryFn: () => getDepartments(branchId) });

  const { data: reportData = [], isLoading } = useQuery({
    queryKey: ["circulation-report", "returned", fetchParams],
    queryFn: () => fetchParams ? getCirculationReport({
      type: 'returned',
      userType: fetchParams.userType,
      startDate: fetchParams.startDate,
      endDate: fetchParams.endDate,
      branches: fetchParams.branches,
      departments: fetchParams.departments,
      branchId,
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
      "Accession No": r.accession_number,
      "Title": r.book_copies?.title || "—",
      "Returned By": r.users?.user_name || r.user_id,
      "Role": r.users?.user_type,
      "Branch / Dept": r.users?.user_type === "student"
        ? (r.users?.programs?.branch_name ?? "—")
        : (r.users?.departments?.department_name ?? "—"),
      "Issue Date": fmtDate(r.issue_date),
      "Return Date": fmtDate(r.return_date),
      "Fine Amount": r.fine_amount || 0
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Returned Books");
    XLSX.writeFile(wb, `Returned_Books_${userType}_${startDate}_to_${endDate}.xlsx`);
    toast.success("Excel downloaded!");
  }

  const degreeGroups = programs.reduce<Record<string, typeof programs>>((acc, p: any) => {
    if (!acc[p.degree]) acc[p.degree] = [];
    acc[p.degree].push(p);
    return acc;
  }, {});

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Returned Books Report" description="Generate and download filtered returned books records" />

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Filter className="w-4 h-4" /> Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {(["all", "student", "faculty"] as const).map(t => (
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
          {(userType === "student" || userType === "all") && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Filter students by branch (leave empty = all)</p>
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
          )}

          {(userType === "faculty" || userType === "all") && (
            <div className="space-y-1 mt-4">
              <p className="text-xs text-muted-foreground">Filter faculty by department (leave empty = all)</p>
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
            <CardTitle className="text-sm flex flex-wrap gap-2 items-center justify-between">
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
                  { header: "Accession No.", accessor: "accession_number" },
                  { header: "Title", accessor: (r: any) => r.book_copies?.title ?? "—" },
                  { header: "Returned By", accessor: (r: any) => r.users?.user_name ?? r.user_id },
                  { header: "Role", accessor: (r: any) => <span className="capitalize">{r.users?.user_type}</span> },
                  { header: "Issue Date", accessor: (r: any) => fmtDate(r.issue_date) },
                  { header: "Return Date", accessor: (r: any) => fmtDate(r.return_date) },
                  { header: "Fine", accessor: (r: any) => r.fine_amount > 0 ? <span className="text-red-500 font-medium">₹{r.fine_amount}</span> : "₹0" },
                  { header: "Status", accessor: () => <StatusBadge status="Available" /> },
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
