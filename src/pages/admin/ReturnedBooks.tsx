import React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getReturnedBooks } from "@/lib/services/issues";
import { fmtDate } from "@/lib/utils";

const ReturnedBooks = () => {
  const { data: returned = [], isLoading } = useQuery({
    queryKey: ["returned-books"],
    queryFn: () => getReturnedBooks(200),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Returned Books" description={`${returned.length} books returned to library`}>
        <Button variant="outline" onClick={() => toast.info("Export feature coming soon")}>
          <Download className="h-4 w-4 mr-1" /> Export
        </Button>
      </PageHeader>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : returned.length === 0 ? (
        <div className="bg-card rounded-xl p-12 border border-border/50 text-center">
          <p className="text-muted-foreground">No returned books yet.</p>
        </div>
      ) : (
        <DataTable
          columns={[
            { header: "Accession No.", accessor: "accession_number" },
            { header: "Title", accessor: (row: any) => row.book_copies?.title || "—" },
            { header: "Returned By", accessor: (row: any) => row.users?.user_name || row.user_id },
            { header: "Issue Date", accessor: (row: any) => fmtDate(row.issue_date) },
            { header: "Return Date", accessor: (row: any) => fmtDate(row.return_date) },
            {
              header: "Fine",
              accessor: (row: any) =>
                row.fine_amount > 0 ? (
                  <span className="text-red-500 font-medium">₹{row.fine_amount}</span>
                ) : "₹0",
            },
            { header: "Status", accessor: () => <StatusBadge status="Available" /> },
          ]}
          data={returned}
        />
      )}
    </div>
  );
};

export default ReturnedBooks;
