import React, { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getIssueByAccession, returnBook, getIssuedBooks } from "@/lib/services/issues";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertTriangle, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable } from "@/components/DataTable";
import { fmtDate } from "@/lib/utils";

const ReturnBook = () => {
  const { adminBranch, isSuperAdmin } = useAuth();
  const branchId = isSuperAdmin ? null : (adminBranch?.branch_id ?? null);
  const queryClient = useQueryClient();
  const [accessionNo, setAccessionNo] = useState("");
  const [lookupAccession, setLookupAccession] = useState<string | null>(null);

  const returnDate = new Date().toISOString().split("T")[0];

  // Active issued books for this branch
  const { data: activeIssues = [], isLoading: loadingActive } = useQuery({
    queryKey: ["issued-books-active", branchId],
    queryFn: () => getIssuedBooks(undefined, branchId),
  });

  // Lookup specific issue
  const { data: issueRecord, isFetching, error } = useQuery({
    queryKey: ["return-lookup", lookupAccession, branchId],
    queryFn: () => getIssueByAccession(lookupAccession!, branchId),
    enabled: !!lookupAccession,
    retry: false,
  });

  const fine = issueRecord ? (() => {
    const today = new Date();
    const due = new Date(issueRecord.due_date);
    const diff = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff * 5 : 0;
  })() : 0;

  const returnMutation = useMutation({
    mutationFn: () => returnBook(lookupAccession!, branchId),
    onSuccess: (data) => {
      toast.success(
        `Book returned successfully!${data.fine > 0 ? ` Fine collected: ₹${data.fine}` : ""}`
      );
      setAccessionNo("");
      setLookupAccession(null);
      queryClient.invalidateQueries({ queryKey: ["issued-books"] });
      queryClient.invalidateQueries({ queryKey: ["issued-books-active"] });
      queryClient.invalidateQueries({ queryKey: ["returned-books"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to return book"),
  });

  const overdueColumns = [
    { header: "Accession No.", accessor: (row: any) => row.accession_number },
    { header: "Title", accessor: (row: any) => row.book_copies?.title || "—" },
    { header: "Issued To", accessor: (row: any) => row.users?.user_name || row.user_id },
    { header: "Issue Date", accessor: (row: any) => fmtDate(row.issue_date) },
    {
      header: "Due Date",
      accessor: (row: any) => {
        const isOverdue = new Date(row.due_date) < new Date();
        return (
          <span className={isOverdue ? "text-red-500 font-semibold" : ""}>
            {fmtDate(row.due_date)}{isOverdue ? " ⚠ Overdue" : ""}
          </span>
        );
      },
    },
    {
      header: "Action",
      accessor: (row: any) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setAccessionNo(row.accession_number);
            setLookupAccession(row.accession_number);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          Return
        </Button>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Return Book" description="Process book return and calculate fines" />
      <div className="space-y-6">

        {/* Lookup & Return Form */}
        <div className="max-w-2xl space-y-6">
          <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
            <h3 className="text-sm font-semibold text-card-foreground">Enter Accession Number</h3>
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
                disabled={isFetching || !accessionNo}
                className="mt-6"
              >
                {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lookup"}
              </Button>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {(error as any)?.message || "No active issue found for this accession number."}
              </div>
            )}
          </div>

          {issueRecord && (
            <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Issue Record Found
              </div>
              <div className="bg-muted rounded-lg p-3 text-sm space-y-2">
                <p><span className="font-medium">Title:</span> {(issueRecord as any).book_copies?.title || issueRecord.accession_number}</p>
                <p><span className="font-medium">Author:</span> {(issueRecord as any).book_copies?.author || "—"}</p>
                <p><span className="font-medium">Issued To:</span> {(issueRecord as any).users?.user_name || issueRecord.user_id}</p>
                <p><span className="font-medium">Issue Date:</span> {issueRecord.issue_date}</p>
                <p><span className="font-medium">Due Date:</span> {issueRecord.due_date}</p>
                <p><span className="font-medium">Return Date:</span> {returnDate}</p>
                {fine > 0 ? (
                  <div className="flex items-center gap-2 text-red-500 font-semibold pt-1">
                    <AlertTriangle className="w-4 h-4" />
                    Overdue Fine: ₹{fine}
                  </div>
                ) : (
                  <p className="text-green-600 font-medium pt-1">✓ Returned on time — No fine</p>
                )}
              </div>
              <Button
                onClick={() => returnMutation.mutate()}
                className="w-full"
                disabled={returnMutation.isPending}
              >
                {returnMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing...</>
                ) : `Process Return${fine > 0 ? ` (Fine: ₹${fine})` : ""}`}
              </Button>
            </div>
          )}
        </div>

        {/* Active Issued Books Table */}
        <div className="bg-card rounded-xl border border-border/50 card-shadow">
          <div className="flex items-center gap-2 p-5 border-b border-border/50">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">
              Active Issues — Books Pending Return
              <span className="ml-2 text-muted-foreground font-normal">({activeIssues.length} total)</span>
            </h3>
          </div>
          {loadingActive ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : activeIssues.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              No books currently issued.
            </div>
          ) : (
            <div className="p-4">
              <DataTable columns={overdueColumns} data={activeIssues} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ReturnBook;
