import React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatsCard } from "@/components/StatsCard";
import { FileText, Download, TrendingUp, Loader2 } from "lucide-react";
import { getPapers } from "@/lib/services/papers";
import { useAuth } from "@/contexts/AuthContext";

const QPDashboard = () => {
  const { adminBranch, isSuperAdmin } = useAuth();
  const branchId = isSuperAdmin ? null : (adminBranch?.branch_id ?? null);

  const { data: papers = [], isLoading } = useQuery({
    queryKey: ["papers", branchId],
    queryFn: () => getPapers(branchId != null ? { branch_id: branchId } : undefined),
  });

  const totalDownloads = papers.reduce((a: number, p: any) => a + (p.downloads || 0), 0);
  const mostPopular = papers.reduce((best: any, p: any) => (!best || p.downloads > best.downloads ? p : best), null);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Question Paper Dashboard" description="Overview of question paper repository" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Total Papers" value={papers.length} icon={FileText} color="primary" />
        <StatsCard title="Total Downloads" value={totalDownloads} icon={Download} color="success" />
        <StatsCard
          title="Most Popular"
          value={mostPopular?.subject_code || "—"}
          icon={TrendingUp}
          color="info"
        />
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : papers.length === 0 ? (
        <div className="bg-card rounded-xl p-12 border border-border/50 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No question papers yet. Upload papers using the Upload Paper page.</p>
        </div>
      ) : (
        <DataTable
          columns={[
            { header: "Subject", accessor: "subject_name" },
            { header: "Code", accessor: (row: any) => row.subject_code || "—" },
            { header: "Department", accessor: (row: any) => row.department || "—" },
            { header: "Semester", accessor: (row: any) => row.semester || "—" },
            { header: "Exam Type", accessor: (row: any) => row.exam_type || "—" },
            { header: "Year", accessor: (row: any) => row.academic_year || "—" },
            { header: "Downloads", accessor: "downloads" },
          ]}
          data={papers}
        />
      )}
    </div>
  );
};

export default QPDashboard;
