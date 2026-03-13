import React from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

const returnedRecords = [
  { accessionNumber: "ACC1020", title: "Compiler Design", returnedBy: "STU2024001", returnDate: "2026-03-10", issueDate: "2026-02-24", fine: "₹0" },
  { accessionNumber: "ACC1021", title: "Discrete Mathematics", returnedBy: "STU2024003", returnDate: "2026-03-08", issueDate: "2026-02-20", fine: "₹10" },
  { accessionNumber: "ACC1022", title: "Software Engineering", returnedBy: "STU2024002", returnDate: "2026-03-05", issueDate: "2026-02-18", fine: "₹0" },
  { accessionNumber: "ACC1023", title: "Theory of Computation", returnedBy: "STU2024004", returnDate: "2026-03-03", issueDate: "2026-02-15", fine: "₹15" },
  { accessionNumber: "ACC1024", title: "Artificial Intelligence", returnedBy: "STU2024005", returnDate: "2026-03-01", issueDate: "2026-02-12", fine: "₹25" },
];

const ReturnedBooks = () => (
  <div className="animate-fade-in">
    <PageHeader title="Returned Books" description="All books that have been returned to the library">
      <Button variant="outline" onClick={() => toast.success("Report exported as PDF")}><Download className="h-4 w-4 mr-1" /> Export PDF</Button>
    </PageHeader>
    <DataTable
      columns={[
        { header: "Accession No.", accessor: "accessionNumber" },
        { header: "Title", accessor: "title" },
        { header: "Returned By", accessor: "returnedBy" },
        { header: "Issue Date", accessor: "issueDate" },
        { header: "Return Date", accessor: "returnDate" },
        { header: "Fine", accessor: "fine" },
        { header: "Status", accessor: () => <StatusBadge status="Available" /> },
      ]}
      data={returnedRecords}
    />
  </div>
);

export default ReturnedBooks;
