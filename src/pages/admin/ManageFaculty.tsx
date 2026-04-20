import React, { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addFaculty, bulkInsertFaculty, getUserById, updateUser, deleteUser } from "@/lib/services/users";
import { getDepartments } from "@/lib/services/catalog";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus, Upload, Search, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function ManageFaculty() {
  const qc = useQueryClient();
  const { adminBranch } = useAuth();
  const branchId = adminBranch?.branch_id ?? null;
  const [form, setForm] = useState({ user_id: "", user_name: "", designation: "", department_id: "" });
  const [searchId, setSearchId] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: departments = [] } = useQuery({ queryKey: ["departments"], queryFn: getDepartments });

  const addMut = useMutation({
    mutationFn: () => addFaculty({
      user_id: form.user_id.trim(),
      user_name: form.user_name.trim(),
      designation: form.designation.trim() || null,
      department_id: form.department_id ? parseInt(form.department_id) : null,
      branch_id: branchId,
    }),
    onSuccess: () => { toast.success("Faculty added!"); setForm({ user_id: "", user_name: "", designation: "", department_id: "" }); },
    onError: (e: any) => toast.error(e.message),
  });

  async function handleExcelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw: any[] = XLSX.utils.sheet_to_json(ws);
      const rows = raw.map((r: any) => {
        const dept = (departments as any[]).find(d => d.department_name === (r.Department ?? r.department_name));
        return {
          user_id: String(r.UserID ?? r.user_id ?? ""),
          user_name: String(r.Name ?? r.user_name ?? ""),
          designation: r.Designation ?? r.designation ?? null,
          department_id: dept?.department_id ?? null,
          branch_id: branchId,
        };
      }).filter(r => r.user_id);
      await bulkInsertFaculty(rows);
      toast.success(`${rows.length} faculty imported!`);
      qc.invalidateQueries({ queryKey: ["users"] });
    } catch (e: any) { toast.error(e.message); }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSearch() {
    if (!searchId.trim()) return;
    try {
      const u = await getUserById(searchId.trim());
      if (u.user_type !== "faculty") { toast.error("User is not faculty"); return; }
      setFoundUser(u);
      setEditForm({ user_name: u.user_name, designation: u.designation ?? "", department_id: u.department_id ?? "" });
    } catch { toast.error("Faculty not found"); }
  }

  async function handleUpdate() {
    try {
      await updateUser(foundUser.user_id, {
        user_name: editForm.user_name,
        designation: editForm.designation || null,
        department_id: editForm.department_id ? parseInt(editForm.department_id) : null,
      });
      toast.success("Updated!"); setFoundUser(null);
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteUser(foundUser.user_id);
      toast.success(`${foundUser.user_name} deleted`);
      setFoundUser(null); setSearchId("");
    } catch (e: any) { toast.error(e.message); }
    setDeleting(false);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Manage Faculty" description="Add, import, and manage faculty records" />
      <Tabs defaultValue="add">
        <TabsList>
          <TabsTrigger value="add">Add Single</TabsTrigger>
          <TabsTrigger value="upload">Bulk Upload</TabsTrigger>
          <TabsTrigger value="edit">Search & Edit</TabsTrigger>
        </TabsList>

        <TabsContent value="add">
          <Card><CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Faculty ID *</label>
                <Input placeholder="e.g. GVP/T/001" value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Full Name *</label>
                <Input placeholder="Faculty Name" value={form.user_name} onChange={e => setForm(f => ({ ...f, user_name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Designation</label>
                <Input placeholder="e.g. Assistant Professor" value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Department</label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}>
                  <option value="">Select department</option>
                  {(departments as any[]).map((d: any) => (
                    <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button onClick={() => addMut.mutate()} disabled={!form.user_id || !form.user_name || addMut.isPending} className="gap-2">
              {addMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Add Faculty
            </Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="upload">
          <Card><CardContent className="pt-6 space-y-4">
            <div className="bg-muted/40 border border-border rounded-lg p-4 text-sm space-y-1">
              <p className="font-semibold">Excel Format (columns):</p>
              <p className="text-muted-foreground font-mono text-xs">UserID | Name | Designation | Department</p>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4" /> Choose Excel File
            </Button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="edit">
          <Card><CardContent className="pt-6 space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Enter Faculty ID" value={searchId} onChange={e => setSearchId(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} />
              <Button variant="outline" onClick={handleSearch} className="gap-2 shrink-0"><Search className="w-4 h-4" /> Search</Button>
            </div>
            {foundUser && (
              <div className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{foundUser.user_name}</p>
                    <p className="text-xs text-muted-foreground">{foundUser.user_id}</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting} className="gap-1">
                    {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Delete
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Name</label>
                    <Input value={editForm.user_name} onChange={e => setEditForm((f: any) => ({ ...f, user_name: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Designation</label>
                    <Input value={editForm.designation} onChange={e => setEditForm((f: any) => ({ ...f, designation: e.target.value }))} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs text-muted-foreground">Department</label>
                    <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={editForm.department_id} onChange={e => setEditForm((f: any) => ({ ...f, department_id: e.target.value }))}>
                      <option value="">Select department</option>
                      {(departments as any[]).map((d: any) => (
                        <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button size="sm" onClick={handleUpdate}>Save Changes</Button>
              </div>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
