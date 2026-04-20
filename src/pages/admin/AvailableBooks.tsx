import React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { getBooks } from "@/lib/services/books";
import { useAuth } from "@/contexts/AuthContext";
import { BookCopy, Loader2 } from "lucide-react";

const AvailableBooks = () => {
  const { adminBranch, isSuperAdmin } = useAuth();
  const branchId = isSuperAdmin ? null : (adminBranch?.branch_id ?? null);
  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books", "available", branchId],
    queryFn: () => getBooks({ status: "Available", branch_id: branchId }),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Available Books"
        description={`${books.length} copies currently available for issue`}
      />
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : books.length === 0 ? (
        <div className="bg-card rounded-xl p-12 border border-border/50 text-center">
          <BookCopy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No books available. Add books to the inventory first.</p>
        </div>
      ) : (
        <DataTable
          columns={[
            { header: "Accession No.", accessor: "accession_number" },
            { header: "Call No.", accessor: (row: any) => row.call_no || "—" },
            { header: "Title", accessor: "title" },
            { header: "Author", accessor: (row: any) => row.author || "—" },
            { header: "Publisher", accessor: (row: any) => row.publisher || "—" },
            { header: "Year", accessor: (row: any) => row.year_of_publication || "—" },
            { header: "Branch", accessor: (row: any) => row.library_branches?.name || "—" },
            { header: "Status", accessor: () => <StatusBadge status="Available" /> },
          ]}
          data={books}
        />
      )}
    </div>
  );
};

export default AvailableBooks;
