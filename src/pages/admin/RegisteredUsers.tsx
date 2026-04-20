import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { getUsers } from "@/lib/services/users";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";

const RegisteredUsers = () => {
  const [search, setSearch] = useState("");
  const { adminBranch, isSuperAdmin } = useAuth();
  const branchId = adminBranch?.branch_id ?? null;

  const { data = [], isLoading } = useQuery({
    queryKey: ["users", branchId],
    queryFn: () => getUsers({ branchId }),
  });

  const filtered = search
    ? data.filter(
        (u: any) =>
          u.user_id.toLowerCase().includes(search.toLowerCase()) ||
          u.user_name.toLowerCase().includes(search.toLowerCase())
      )
    : data;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Registered Users"
        description={`Library registered users (${data.length} total)`}
      />
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or roll no..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={[
            { header: "Roll No / ID", accessor: "user_id" },
            { header: "Name", accessor: "user_name" },
            {
              header: "Type",
              accessor: (row: any) => (
                <Badge variant={row.user_type === "student" ? "default" : "secondary"}>
                  {row.user_type}
                </Badge>
              ),
            },
            { header: "Program", accessor: (row: any) => row.programs?.branch_name || "—" },
            { header: "Year", accessor: (row: any) => row.year ? `Year ${row.year}` : "—" },
            { header: "Dept", accessor: (row: any) => row.departments?.department_name || "—" },
          ]}
          data={filtered}
        />
      )}
    </div>
  );
};

export default RegisteredUsers;
