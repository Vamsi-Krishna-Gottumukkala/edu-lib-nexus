import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/DataTable";
import { getDepartments, addDepartment, deleteDepartment } from "@/lib/services/catalog";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ManageDepartments() {
  const qc = useQueryClient();
  const [deptName, setDeptName] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: departments = [], isLoading } = useQuery({ queryKey: ["departments"], queryFn: getDepartments });

  const addMut = useMutation({
    mutationFn: () => addDepartment(deptName),
    onSuccess: () => { toast.success("Department added!"); setDeptName(""); qc.invalidateQueries({ queryKey: ["departments"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  async function handleDelete(id: number) {
    setDeletingId(id);
    try { await deleteDepartment(id); toast.success("Department deleted"); qc.invalidateQueries({ queryKey: ["departments"] }); }
    catch (e: any) { toast.error(e.message); }
    setDeletingId(null);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Manage Departments" description="Add and remove faculty departments" />

      <Card><CardContent className="pt-6 space-y-4">
        <h3 className="text-sm font-semibold">Add New Department</h3>
        <div className="flex gap-2 max-w-sm">
          <Input placeholder="Department Name" value={deptName} onChange={e => setDeptName(e.target.value)} onKeyDown={e => e.key === "Enter" && addMut.mutate()} />
          <Button onClick={() => addMut.mutate()} disabled={!deptName.trim() || addMut.isPending} className="gap-2 shrink-0">
            {addMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </Button>
        </div>
      </CardContent></Card>

      <Card><CardContent className="pt-4">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <DataTable
            columns={[
              { header: "#", accessor: "department_id" },
              { header: "Department Name", accessor: "department_name" },
              {
                header: "Action",
                accessor: (r: any) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-destructive hover:text-destructive gap-1"
                    onClick={() => handleDelete(r.department_id)}
                    disabled={deletingId === r.department_id}
                  >
                    {deletingId === r.department_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Delete
                  </Button>
                ),
              },
            ]}
            data={departments}
          />
        )}
      </CardContent></Card>
    </div>
  );
}
