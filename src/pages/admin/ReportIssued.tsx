import React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Download, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { getIssuedBooks } from "@/lib/services/issues";
import { fmtDate, exportToCSV } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const ReportIssued = () => {
  const { adminBranch, isSuperAdmin } = useAuth();
  const branchId = isSuperAdmin ? null : (adminBranch?.branch_id ?? null);
  const { data: issued = [], isLoading } = useQuery({
    queryKey: ["issued-books", branchId],
    queryFn: () => getIssuedBooks(undefined, branchId),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Issued Books Report" description={`${issued.length} books currently issued`}>
        <Button variant="outline" onClick={() => exportToCSV(issued.map((i: any) => ({
          'Accession No': i.accession_number,
          'Title': i.book_copies?.title,
          'Issued To': i.users?.user_name || i.user_id,
          'Issue Date': fmtDate(i.issue_date),
          'Due Date': fmtDate(i.due_date),
          'Overdue': new Date(i.due_date) < new Date() ? 'Yes' : 'No'
        })), 'issued_books_report')}>
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
