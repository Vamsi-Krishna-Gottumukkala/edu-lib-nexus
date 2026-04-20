import React, { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserById } from "@/lib/services/users";
import { getBookByAccession } from "@/lib/services/books";
import { issueBook } from "@/lib/services/issues";
import { getBranches } from "@/lib/services/branches";
import { getSettings } from "@/lib/services/settings";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const IssueBook = () => {
  const queryClient = useQueryClient();
  const [studentId, setStudentId] = useState("");
  const [accessionNo, setAccessionNo] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [lookupStudentId, setLookupStudentId] = useState<string | null>(null);
  const [lookupAccession, setLookupAccession] = useState<string | null>(null);

  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: getSettings });

  const { data: foundStudent, isFetching: studentLoading, error: studentError } = useQuery({
    queryKey: ["student-lookup", lookupStudentId],
    queryFn: () => getUserById(lookupStudentId!),
    enabled: !!lookupStudentId,
    retry: false,
  });

  const { data: foundBook, isFetching: bookLoading, error: bookError } = useQuery({
    queryKey: ["book-lookup", lookupAccession],
    queryFn: () => getBookByAccession(lookupAccession!),
    enabled: !!lookupAccession,
    retry: false,
  });

  const issueMutation = useMutation({
    mutationFn: () => {
      const maxDays = parseInt(settings?.max_issue_days || "14");
      const today = new Date();
      const due = new Date(dueDate);
      const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return issueBook(foundStudent!.user_id, foundBook!.accession_number, diffDays);
    },
    onSuccess: () => {
      toast.success(`Book issued to ${foundStudent?.user_name} successfully!`);
      setStudentId(""); setAccessionNo(""); setLookupStudentId(null); setLookupAccession(null);
      queryClient.invalidateQueries({ queryKey: ["issued-books"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
      queryClient.invalidateQueries({ queryKey: ["book-lookup"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to issue book"),
  });

  const handleIssue = () => {
    if (!foundStudent) { toast.error("Please lookup a student first"); return; }
    if (!foundBook) { toast.error("Please lookup a book first"); return; }
    if (foundBook.status !== "Available") {
      toast.error(`Book is ${foundBook.status}. Cannot issue.`); return;
    }
    if (!dueDate) { toast.error("Please set a due date"); return; }
    issueMutation.mutate();
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Issue Book" description="Issue a book copy to a student" />
      <div className="max-w-2xl space-y-6">

        {/* Student Lookup */}
        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
          <h3 className="text-sm font-semibold text-card-foreground">Step 1: Student Lookup</h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Student Roll Number</Label>
              <Input
                placeholder="e.g. 5221411057"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && setLookupStudentId(studentId)}
              />
            </div>
            <Button
              onClick={() => setLookupStudentId(studentId)}
              className="mt-6"
              disabled={studentLoading || !studentId}
            >
              {studentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lookup"}
            </Button>
          </div>
          {studentError && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <XCircle className="w-4 h-4" /> Student not found
            </div>
          )}
          {foundStudent && (
            <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
              <div className="flex items-center gap-2 text-green-600 font-medium mb-2">
                <CheckCircle className="w-4 h-4" /> Student Found
              </div>
              <p><span className="font-medium">Name:</span> {foundStudent.user_name}</p>
              <p><span className="font-medium">Roll No:</span> {foundStudent.user_id}</p>
              <p><span className="font-medium">Type:</span> {foundStudent.user_type}</p>
              {(foundStudent as any).programs && (
                <p><span className="font-medium">Program:</span> {(foundStudent as any).programs.branch_name}</p>
              )}
            </div>
          )}
        </div>

        {/* Book Lookup */}
        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
          <h3 className="text-sm font-semibold text-card-foreground">Step 2: Book Lookup</h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Accession Number</Label>
              <Input
                placeholder="e.g. GVP/LIB/2024/001"
                value={accessionNo}
                onChange={e => setAccessionNo(e.target.value)}
                onKeyDown={e => e.key === "Enter" && setLookupAccession(accessionNo)}
              />
            </div>
            <Button
              onClick={() => setLookupAccession(accessionNo)}
              className="mt-6"
              disabled={bookLoading || !accessionNo}
            >
              {bookLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lookup"}
            </Button>
          </div>
          {bookError && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <XCircle className="w-4 h-4" /> Book not found
            </div>
          )}
          {foundBook && (
            <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
              <div className={`flex items-center gap-2 font-medium mb-2 ${foundBook.status === "Available" ? "text-green-600" : "text-red-500"}`}>
                {foundBook.status === "Available" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {foundBook.status}
              </div>
              <p><span className="font-medium">Title:</span> {foundBook.title}</p>
              <p><span className="font-medium">Author:</span> {foundBook.author || "—"}</p>
              <p><span className="font-medium">ISBN:</span> {foundBook.isbn || "—"}</p>
              <p><span className="font-medium">Branch:</span> {(foundBook as any).library_branches?.name || "—"}</p>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
          <h3 className="text-sm font-semibold text-card-foreground">Step 3: Set Due Date</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Issue Date</Label>
              <Input type="date" value={today} disabled />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                min={today}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleIssue}
            className="w-full"
            disabled={issueMutation.isPending || !foundStudent || !foundBook || foundBook.status !== "Available"}
          >
            {issueMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Issuing...</>
            ) : "Issue Book"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IssueBook;
