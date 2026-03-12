import React from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { mockBooks } from "@/lib/mockData";
import { StatsCard } from "@/components/StatsCard";
import { BookOpen, BookCopy, AlertTriangle, XCircle } from "lucide-react";

const InventoryOverview = () => {
  const total = mockBooks.length;
  const available = mockBooks.filter(b => b.status === "Available").length;
  const issued = mockBooks.filter(b => b.status === "Issued").length;
  const lost = mockBooks.filter(b => b.status === "Lost").length;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Inventory Overview" description="Complete book inventory with accession tracking" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total Copies" value={total} icon={BookOpen} color="primary" />
        <StatsCard title="Available" value={available} icon={BookCopy} color="success" />
        <StatsCard title="Issued" value={issued} icon={BookOpen} color="info" />
        <StatsCard title="Lost" value={lost} icon={AlertTriangle} color="destructive" />
      </div>

      <DataTable
        columns={[
          { header: "Accession No.", accessor: "accessionNumber" },
          { header: "Title", accessor: "title" },
          { header: "Author", accessor: "author" },
          { header: "Category", accessor: "category" },
          { header: "Branch", accessor: "branch" },
          { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> },
        ]}
        data={mockBooks.filter(b => b.status !== "Withdrawn")}
      />
    </div>
  );
};

export default InventoryOverview;
