import React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatsCard } from "@/components/StatsCard";
import { Building2, BookOpen, BookCopy, Loader2 } from "lucide-react";
import { getBranchStats } from "@/lib/services/branches";

const BranchOverview = () => {
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["branch-stats"],
    queryFn: getBranchStats,
  });

  const totals = branches.reduce((acc: any, b: any) => ({
    total: acc.total + b.total,
    available: acc.available + b.available,
  }), { total: 0, available: 0 });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Branch Overview" description="Library branches and their book inventory statistics" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Total Branches" value={branches.length} icon={Building2} color="primary" />
        <StatsCard title="Total Books" value={totals.total} icon={BookOpen} color="info" />
        <StatsCard title="Available" value={totals.available} icon={BookCopy} color="success" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : branches.length === 0 ? (
        <div className="bg-card rounded-xl p-12 border border-border/50 text-center">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No branches yet. Add branches using the Add Branch page.</p>
        </div>
      ) : (
        <DataTable
          columns={[
            { header: "Branch Name", accessor: "name" },
            { header: "Location", accessor: (row: any) => row.location || "—" },
            { header: "Librarian", accessor: (row: any) => row.librarian || "—" },
            { header: "Total Books", accessor: "total" },
            { header: "Available", accessor: "available" },
            { header: "Issued", accessor: "issued" },
          ]}
          data={branches}
        />
      )}
    </div>
  );
};

export default BranchOverview;
