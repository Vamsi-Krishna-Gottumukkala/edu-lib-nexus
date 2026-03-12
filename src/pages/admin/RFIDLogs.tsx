import React from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { mockRFIDLogs } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";

const RFIDLogs = () => {
  return (
    <div className="animate-fade-in">
      <PageHeader title="RFID Logs" description="Library gate entry and exit records" />
      <DataTable
        columns={[
          { header: "Student ID", accessor: "studentId" },
          { header: "Name", accessor: "studentName" },
          { header: "Department", accessor: "department" },
          { header: "Date", accessor: "date" },
          { header: "Entry", accessor: "entryTime" },
          { header: "Exit", accessor: (row) => row.exitTime || <Badge variant="warning">In Library</Badge> },
        ]}
        data={mockRFIDLogs}
      />
    </div>
  );
};

export default RFIDLogs;
