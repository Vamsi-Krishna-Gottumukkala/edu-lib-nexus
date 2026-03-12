import React from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatsCard } from "@/components/StatsCard";
import { mockBranches } from "@/lib/mockData";
import { Building2, BookOpen, BookCopy } from "lucide-react";
import { Button } from "@/components/ui/button";

const BranchOverview = () => {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Branch Overview" description="Manage library branches" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Total Branches" value={mockBranches.length} icon={Building2} color="primary" />
        <StatsCard title="Total Books" value={mockBranches.reduce((a, b) => a + b.totalBooks, 0)} icon={BookOpen} color="info" />
        <StatsCard title="Available" value={mockBranches.reduce((a, b) => a + b.availableBooks, 0)} icon={BookCopy} color="success" />
      </div>

      <DataTable
        columns={[
          { header: "Branch", accessor: "name" },
          { header: "Location", accessor: "location" },
          { header: "Total Books", accessor: "totalBooks" },
          { header: "Available", accessor: "availableBooks" },
          { header: "Librarian", accessor: "librarian" },
        ]}
        data={mockBranches}
      />
    </div>
  );
};

export default BranchOverview;
