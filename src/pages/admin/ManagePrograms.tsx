import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/DataTable";
import { getPrograms, addProgram, deleteProgram } from "@/lib/services/catalog";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ManagePrograms() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ degree: "", branch_name: "", branch_code: "" });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: programs = [], isLoading } = useQuery({ queryKey: ["programs"], queryFn: getPrograms });

  const addMut = useMutation({
    mutationFn: () => addProgram({ degree: form.degree.trim(), branch_name: form.branch_name.trim(), branch_code: form.branch_code.trim() }),
    onSuccess: () => { toast.success("Program added!"); setForm({ degree: "", branch_name: "", branch_code: "" }); qc.invalidateQueries({ queryKey: ["programs"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  async function handleDelete(id: number) {
    setDeletingId(id);
    try { await deleteProgram(id); toast.success("Program deleted"); qc.invalidateQueries({ queryKey: ["programs"] }); }
    catch (e: any) { toast.error(e.message); }
    setDeletingId(null);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Manage Programs" description="Add and remove academic degree programs" />

      {/* Add form */}
      <Card><CardContent className="pt-6 space-y-4">
        <h3 className="text-sm font-semibold">Add New Program</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Degree *</label>
            <Input placeholder="e.g. B.Tech" value={form.degree} onChange={e => setForm(f => ({ ...f, degree: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Branch Name *</label>
            <Input placeholder="e.g. Computer Science & Engineering" value={form.branch_name} onChange={e => setForm(f => ({ ...f, branch_name: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Branch Code *</label>
            <Input placeholder="e.g. CSE" value={form.branch_code} onChange={e => setForm(f => ({ ...f, branch_code: e.target.value.toUpperCase() }))} />
          </div>
        </div>
        <Button onClick={() => addMut.mutate()} disabled={!form.degree || !form.branch_name || !form.branch_code || addMut.isPending} className="gap-2">
          {addMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add Program
        </Button>
      </CardContent></Card>

      {/* List */}
      <Card><CardContent className="pt-4">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <DataTable
            columns={[
              { header: "Degree", accessor: "degree" },
              { header: "Branch Name", accessor: "branch_name" },
              { header: "Code", accessor: (r: any) => <span className="font-mono text-xs">{r.branch_code}</span> },
              {
                header: "Action",
                accessor: (r: any) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-destructive hover:text-destructive gap-1"
                    onClick={() => handleDelete(r.program_id)}
                    disabled={deletingId === r.program_id}
                  >
                    {deletingId === r.program_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Delete
                  </Button>
                ),
              },
            ]}
            data={programs}
          />
        )}
      </CardContent></Card>
    </div>
  );
}
