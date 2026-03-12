import React from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { mockBooks } from "@/lib/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

const ReportIssued = () => {
  const issued = mockBooks.filter(b => b.status === "Issued");
  return (
    <div className="animate-fade-in">
      <PageHeader title="Issued Books Report" description="All currently issued book records">
        <Button variant="outline" onClick={() => toast.success("Report exported as PDF")}><Download className="h-4 w-4 mr-1" /> Export PDF</Button>
        <Button variant="outline" onClick={() => toast.success("Report exported as Excel")}><Download className="h-4 w-4 mr-1" /> Export Excel</Button>
      </PageHeader>
      <DataTable
        columns={[
          { header: "Accession No.", accessor: "accessionNumber" },
          { header: "Title", accessor: "title" },
          { header: "Issued To", accessor: "issuedTo" },
          { header: "Issue Date", accessor: "issueDate" },
          { header: "Due Date", accessor: "dueDate" },
          { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> },
        ]}
        data={issued}
      />
    </div>
  );
};

export default ReportIssued;
