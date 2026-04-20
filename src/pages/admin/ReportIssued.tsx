import React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Download, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { getIssuedBooks } from "@/lib/services/issues";
import { fmtDate } from "@/lib/utils";

const ReportIssued = () => {
  const { data: issued = [], isLoading } = useQuery({
    queryKey: ["issued-books"],
    queryFn: () => getIssuedBooks(),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Issued Books Report" description={`${issued.length} books currently issued`}>
        <Button variant="outline" onClick={() => toast.info("Export feature coming soon")}>
          <Download className="h-4 w-4 mr-1" /> Export
        </Button>
      </PageHeader>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : issued.length === 0 ? (
        <div className="bg-card rounded-xl p-12 border border-border/50 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No books currently issued.</p>
        </div>
      ) : (
        <DataTable
          columns={[
            { header: "Accession No.", accessor: "accession_number" },
            { header: "Title", accessor: (row: any) => row.book_copies?.title || "—" },
            { header: "Issued To", accessor: (row: any) => row.users?.user_name || row.user_id },
            { header: "Issue Date", accessor: (row: any) => fmtDate(row.issue_date) },
            { header: "Due Date", accessor: (row: any) => fmtDate(row.due_date) },
            { header: "Status", accessor: () => <StatusBadge status="Issued" /> },
          ]}
          data={issued}
        />
      )}
    </div>
  );
};

export default ReportIssued;
