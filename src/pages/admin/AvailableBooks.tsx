import React from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { mockBooks } from "@/lib/mockData";
import { StatusBadge } from "@/components/StatusBadge";

const AvailableBooks = () => {
  const available = mockBooks.filter(b => b.status === "Available");
  return (
    <div className="animate-fade-in">
      <PageHeader title="Available Books" description={`${available.length} copies currently available`} />
      <DataTable
        columns={[
          { header: "Accession No.", accessor: "accessionNumber" },
          { header: "Title", accessor: "title" },
          { header: "Author", accessor: "author" },
          { header: "Category", accessor: "category" },
          { header: "Branch", accessor: "branch" },
          { header: "Status", accessor: () => <StatusBadge status="Available" /> },
        ]}
        data={available}
      />
    </div>
  );
};

export default AvailableBooks;
