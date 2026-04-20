import React, { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { addStudent, bulkInsertStudents, getUserById, updateUser, deleteUser, massDeleteStudents } from "@/lib/services/users";
import { getPrograms } from "@/lib/services/catalog";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus, Upload, Search, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function ManageStudents() {
  const qc = useQueryClient();
  const { adminBranch } = useAuth();
  const branchId = adminBranch?.branch_id ?? null;
  const [form, setForm] = useState({ user_id: "", user_name: "", year: "", program_id: "" });
  const [searchId, setSearchId] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [massProgram, setMassProgram] = useState("");
  const [massYear, setMassYear] = useState("");
  const [massConfirm, setMassConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: programs = [] } = useQuery({ queryKey: ["programs"], queryFn: getPrograms });

  // Add single student
  const addMut = useMutation({
    mutationFn: () => addStudent({
      user_id: form.user_id.trim(),
      user_name: form.user_name.trim(),
      year: form.year ? parseInt(form.year) : null,
      program_id: form.program_id ? parseInt(form.program_id) : null,
      branch_id: branchId,
    }),
    onSuccess: () => { toast.success("Student added!"); setForm({ user_id: "", user_name: "", year: "", program_id: "" }); },
    onError: (e: any) => toast.error(e.message),
  });

  // Excel upload
  async function handleExcelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw: any[] = XLSX.utils.sheet_to_json(ws);

      const rows = raw.map((r: any) => {
        const prog = (programs as any[]).find(
          p => p.degree === r.Degree && p.branch_code === r.BranchCode
        );
        return {
          user_id: String(r.RollNo ?? r.user_id ?? ""),
          user_name: String(r.Name ?? r.user_name ?? ""),
          year: r.Year ? parseInt(r.Year) : null,
          program_id: prog?.program_id ?? null,
          branch_id: branchId,
        };
      }).filter(r => r.user_id);

      await bulkInsertStudents(rows);
      toast.success(`${rows.length} students imported!`);
      qc.invalidateQueries({ queryKey: ["users"] });
    } catch (e: any) {
      toast.error(e.message);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  // Search + Edit
  async function handleSearch() {
    if (!searchId.trim()) return;
    try {
      const u = await getUserById(searchId.trim());
      if (u.user_type !== "student") { toast.error("User is not a student"); return; }
      setFoundUser(u);
      setEditForm({ user_name: u.user_name, year: u.year ?? "", program_id: u.program_id ?? "" });
    } catch { toast.error("Student not found"); }
  }

  async function handleUpdate() {
    try {
      await updateUser(foundUser.user_id, {
        user_name: editForm.user_name,
        year: editForm.year ? parseInt(editForm.year) : null,
        program_id: editForm.program_id ? parseInt(editForm.program_id) : null,
      });
      toast.success("Updated!");
      setFoundUser(null);
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleDelete() {
    if (!foundUser) return;
    setDeleting(true);
    try {
      await deleteUser(foundUser.user_id);
      toast.success(`${foundUser.user_name} deleted`);
      setFoundUser(null); setSearchId("");
    } catch (e: any) { toast.error(e.message); }
    setDeleting(false);
  }

  async function handleMassDelete() {
    if (massConfirm !== "confirm delete") { toast.error("Type 'confirm delete' exactly"); return; }
    if (!massProgram || !massYear) { toast.error("Select program and year"); return; }
    setDeleting(true);
    try {
      const count = await massDeleteStudents(parseInt(massProgram), parseInt(massYear), branchId);
      toast.success(`${count} students deleted`);
      setMassProgram(""); setMassYear(""); setMassConfirm("");
      qc.invalidateQueries({ queryKey: ["users"] });
    } catch (e: any) { toast.error(e.message); }
    setDeleting(false);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Manage Students" description="Add, import, and manage student records" />

      <Tabs defaultValue="add">
        <TabsList>
          <TabsTrigger value="add">Add Single</TabsTrigger>
          <TabsTrigger value="upload">Bulk Upload</TabsTrigger>
          <TabsTrigger value="edit">Search & Edit</TabsTrigger>
          <TabsTrigger value="mass-delete">Mass Delete</TabsTrigger>
        </TabsList>

        {/* Add Single */}
        <TabsContent value="add">
          <Card><CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Roll Number *</label>
                <Input placeholder="e.g. 5221411001" value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Full Name *</label>
                <Input placeholder="Student Name" value={form.user_name} onChange={e => setForm(f => ({ ...f, user_name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Year of Study</label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}>
                  <option value="">Select year</option>
                  {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Program</label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.program_id} onChange={e => setForm(f => ({ ...f, program_id: e.target.value }))}>
                  <option value="">Select program</option>
                  {(programs as any[]).map((p: any) => (
                    <option key={p.program_id} value={p.program_id}>{p.degree} — {p.branch_name}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button onClick={() => addMut.mutate()} disabled={!form.user_id || !form.user_name || addMut.isPending} className="gap-2">
              {addMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Add Student
            </Button>
          </CardContent></Card>
        </TabsContent>

        {/* Bulk Upload */}
        <TabsContent value="upload">
          <Card><CardContent className="pt-6 space-y-4">
            <div className="bg-muted/40 border border-border rounded-lg p-4 text-sm space-y-1">
              <p className="font-semibold">Excel Format (columns):</p>
              <p className="text-muted-foreground font-mono text-xs">RollNo | Name | Year | Degree | BranchCode</p>
              <p className="text-muted-foreground text-xs">Example row: <span className="font-mono">5221411001 | Ravi Kumar | 2 | B.Tech | CSE</span></p>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4" /> Choose Excel File
            </Button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} />
          </CardContent></Card>
        </TabsContent>

        {/* Search & Edit */}
        <TabsContent value="edit">
          <Card><CardContent className="pt-6 space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Enter Roll Number" value={searchId} onChange={e => setSearchId(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} />
              <Button variant="outline" onClick={handleSearch} className="gap-2 shrink-0">
                <Search className="w-4 h-4" /> Search
              </Button>
            </div>
            {foundUser && (
              <div className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{foundUser.user_name}</p>
                    <p className="text-xs text-muted-foreground">{foundUser.user_id}</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting} className="gap-1">
                    {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Delete
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Name</label>
                    <Input value={editForm.user_name} onChange={e => setEditForm((f: any) => ({ ...f, user_name: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Year</label>
                    <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={editForm.year} onChange={e => setEditForm((f: any) => ({ ...f, year: e.target.value }))}>
                      <option value="">Select year</option>
                      {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs text-muted-foreground">Program</label>
                    <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={editForm.program_id} onChange={e => setEditForm((f: any) => ({ ...f, program_id: e.target.value }))}>
                      <option value="">Select program</option>
                      {(programs as any[]).map((p: any) => (
                        <option key={p.program_id} value={p.program_id}>{p.degree} — {p.branch_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button size="sm" onClick={handleUpdate}>Save Changes</Button>
              </div>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* Mass Delete */}
        <TabsContent value="mass-delete">
          <Card><CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-2 text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>This will permanently delete <strong>all students</strong> in the selected program + year along with their RFID and attendance records.</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Program</label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={massProgram} onChange={e => setMassProgram(e.target.value)}>
                  <option value="">Select program</option>
                  {(programs as any[]).map((p: any) => (
                    <option key={p.program_id} value={p.program_id}>{p.degree} — {p.branch_name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Year</label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={massYear} onChange={e => setMassYear(e.target.value)}>
                  <option value="">Select year</option>
                  {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Type <strong>confirm delete</strong> to proceed</label>
              <Input placeholder="confirm delete" value={massConfirm} onChange={e => setMassConfirm(e.target.value)} />
            </div>
            <Button variant="destructive" onClick={handleMassDelete} disabled={deleting} className="gap-2">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete All Matching Students
            </Button>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
