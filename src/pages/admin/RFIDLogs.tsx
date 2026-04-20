import React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { getAttendanceLogs } from "@/lib/services/attendance";
import { useAuth } from "@/contexts/AuthContext";
import { fmtDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const RFIDLogs = () => {
  const { adminBranch, isSuperAdmin } = useAuth();
  const branchId = isSuperAdmin ? null : (adminBranch?.branch_id ?? null);
  const { data = [], isLoading } = useQuery({
    queryKey: ["rfid-logs", branchId],
    queryFn: () => getAttendanceLogs(undefined, branchId),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="RFID Logs" description="Library gate entry and exit records" />
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={[
            { header: "Roll No", accessor: "user_id" },
            { header: "Name", accessor: (row: any) => row.users?.user_name || "—" },
            { header: "Program", accessor: (row: any) => row.users?.programs?.branch_name || "—" },
            { header: "Date", accessor: (row: any) => fmtDate(row.log_date) },
            { header: "Entry", accessor: "login_time" },
            {
              header: "Exit",
              accessor: (row: any) =>
                row.logout_time ? row.logout_time : <Badge variant="warning">In Library</Badge>,
            },
          ]}
          data={data}
        />
      )}
    </div>
  );
};

export default RFIDLogs;
