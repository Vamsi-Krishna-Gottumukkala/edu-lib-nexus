import React, { useState, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, File, Loader2, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadPaper } from "@/lib/services/papers";
import { supabase } from "@/lib/supabase";

const EXAM_TYPES = ["End Semester", "Mid Semester", "Supplementary", "Internal Assessment"];

const UploadPaper = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    subject_name: "", subject_code: "", department: "",
    semester: "", exam_type: "", academic_year: "",
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("department_name").order("department_name");
      if (error) throw error;
      return data.map(d => d.department_name);
    }
  });

  const upd = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const uploadMutation = useMutation({
    mutationFn: () =>
      uploadPaper(
        {
          subject_name: form.subject_name,
          subject_code: form.subject_code || null,
          department: form.department || null,
          semester: form.semester ? parseInt(form.semester) : null,
          exam_type: form.exam_type || null,
          academic_year: form.academic_year || null,
        },
        selectedFile!
      ),
    onSuccess: () => {
      toast.success("Question paper uploaded successfully!");
      setForm({ subject_name: "", subject_code: "", department: "", semester: "", exam_type: "", academic_year: "" });
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["papers"] });
    },
    onError: (err: any) => toast.error(err.message || "Upload failed"),
  });

  const handleUpload = () => {
    if (!form.subject_name || !form.subject_code || !form.department) {
      toast.error("Subject Name, Code and Department are required"); return;
    }
    if (!selectedFile) {
      toast.error("Please select a PDF file"); return;
    }
    uploadMutation.mutate();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Upload Question Paper" description="Upload previous year question papers to Supabase Storage" />
      <div className="max-w-2xl">
        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Label>Subject Name *</Label>
              <Input placeholder="e.g. Data Structures" value={form.subject_name} onChange={e => upd("subject_name", e.target.value)} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label>Subject Code *</Label>
              <Input placeholder="e.g. CS301" value={form.subject_code} onChange={e => upd("subject_code", e.target.value)} />
            </div>
            <div>
              <Label>Department *</Label>
              <Select value={form.department} onValueChange={v => upd("department", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Semester</Label>
              <Input type="number" min="1" max="8" placeholder="1–8" value={form.semester} onChange={e => upd("semester", e.target.value)} />
            </div>
            <div>
              <Label>Exam Type</Label>
              <Select value={form.exam_type} onValueChange={v => upd("exam_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{EXAM_TYPES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Academic Year</Label>
              <Input placeholder="e.g. 2025-26" value={form.academic_year} onChange={e => upd("academic_year", e.target.value)} />
            </div>
          </div>

          {/* File Drop Zone */}
          <div>
            <Label>PDF File *</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={e => setSelectedFile(e.target.files?.[0] || null)}
            />
            {selectedFile ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <File className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</span>
                <button onClick={() => setSelectedFile(null)}>
                  <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/40 transition-colors"
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to select a PDF file</p>
                <p className="text-xs text-muted-foreground mt-1">Max 50MB</p>
              </button>
            )}
          </div>

          <Button onClick={handleUpload} className="w-full" disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Uploading to Supabase Storage...</>
            ) : "Upload Paper"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadPaper;
