import React, { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockBooks, mockStudents } from "@/lib/mockData";
import { toast } from "sonner";

const IssueBook = () => {
  const [studentId, setStudentId] = useState("");
  const [accessionNo, setAccessionNo] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [foundStudent, setFoundStudent] = useState<typeof mockStudents[0] | null>(null);
  const [foundBook, setFoundBook] = useState<typeof mockBooks[0] | null>(null);

  const lookupStudent = () => {
    const s = mockStudents.find(s => s.id === studentId);
    setFoundStudent(s || null);
    if (!s) toast.error("Student not found");
  };

  const lookupBook = () => {
    const b = mockBooks.find(b => b.accessionNumber === accessionNo);
    setFoundBook(b || null);
    if (!b) toast.error("Book not found");
    else if (b.status !== "Available") toast.error(`Book status: ${b.status}. Cannot issue.`);
  };

  const handleIssue = () => {
    if (!foundStudent || !foundBook || foundBook.status !== "Available") {
      toast.error("Please verify student and book details");
      return;
    }
    if (!dueDate) { toast.error("Please set a due date"); return; }
    toast.success(`Book ${accessionNo} issued to ${foundStudent.name}`);
    setStudentId(""); setAccessionNo(""); setFoundStudent(null); setFoundBook(null); setDueDate("");
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Issue Book" description="Issue a book copy to a student" />
      <div className="max-w-2xl space-y-6">
        {/* Student Lookup */}
        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
          <h3 className="text-sm font-semibold text-card-foreground">Step 1: Student Lookup</h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Student ID</Label>
              <Input placeholder="e.g. STU2024001" value={studentId} onChange={e => setStudentId(e.target.value)} />
            </div>
            <Button onClick={lookupStudent} className="mt-6">Lookup</Button>
          </div>
          {foundStudent && (
            <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
              <p><span className="font-medium">Name:</span> {foundStudent.name}</p>
              <p><span className="font-medium">Department:</span> {foundStudent.department}</p>
              <p><span className="font-medium">Semester:</span> {foundStudent.semester}</p>
            </div>
          )}
        </div>

        {/* Book Lookup */}
        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
          <h3 className="text-sm font-semibold text-card-foreground">Step 2: Book Lookup</h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Accession Number</Label>
              <Input placeholder="e.g. ACC1001" value={accessionNo} onChange={e => setAccessionNo(e.target.value)} />
            </div>
            <Button onClick={lookupBook} className="mt-6">Lookup</Button>
          </div>
          {foundBook && (
            <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
              <p><span className="font-medium">Title:</span> {foundBook.title}</p>
              <p><span className="font-medium">Author:</span> {foundBook.author}</p>
              <p><span className="font-medium">Branch:</span> {foundBook.branch}</p>
              <p><span className="font-medium">Status:</span> {foundBook.status}</p>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
          <h3 className="text-sm font-semibold text-card-foreground">Step 3: Set Dates</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Issue Date</Label>
              <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleIssue} className="w-full">Issue Book</Button>
        </div>
      </div>
    </div>
  );
};

export default IssueBook;
