import React, { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { departments, examTypes } from "@/lib/mockData";
import { toast } from "sonner";
import { Upload } from "lucide-react";

const UploadPaper = () => {
  const [form, setForm] = useState({
    subjectName: "", subjectCode: "", department: "", semester: "", examType: "", academicYear: "",
  });

  const handleUpload = () => {
    if (!form.subjectName || !form.subjectCode || !form.department) {
      toast.error("Fill all required fields"); return;
    }
    toast.success("Question paper uploaded successfully");
    setForm({ subjectName: "", subjectCode: "", department: "", semester: "", examType: "", academicYear: "" });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Upload Question Paper" description="Upload previous year question papers" />
      <div className="max-w-2xl">
        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Subject Name *</Label>
              <Input value={form.subjectName} onChange={e => setForm({ ...form, subjectName: e.target.value })} />
            </div>
            <div>
              <Label>Subject Code *</Label>
              <Input value={form.subjectCode} onChange={e => setForm({ ...form, subjectCode: e.target.value })} />
            </div>
            <div>
              <Label>Department *</Label>
              <Select value={form.department} onValueChange={v => setForm({ ...form, department: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Semester</Label>
              <Input type="number" min="1" max="8" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} />
            </div>
            <div>
              <Label>Exam Type</Label>
              <Select value={form.examType} onValueChange={v => setForm({ ...form, examType: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{examTypes.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Academic Year</Label>
              <Input placeholder="2025-26" value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value })} />
            </div>
          </div>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Drag & drop PDF file or click to browse</p>
            <Button variant="outline" className="mt-3">Choose File</Button>
          </div>
          <Button onClick={handleUpload} className="w-full">Upload Paper</Button>
        </div>
      </div>
    </div>
  );
};

export default UploadPaper;
