import React, { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBooks, getBookByAccession, updateBookStatus } from "@/lib/services/books";
import { Loader2, CheckCircle } from "lucide-react";
import { DataTable } from "@/components/DataTable";

const WITHDRAW_REASONS = ["Damaged Beyond Repair", "Obsolete Content", "Lost Pages", "Water Damaged", "Duplicate Copy", "Outdated Edition"];

const WithdrawBooks = () => {
  const queryClient = useQueryClient();
  const [accessionNo, setAccessionNo] = useState("");
  const [reason, setReason] = useState("");
  const [lookupAccession, setLookupAccession] = useState<string | null>(null);

  const { data: withdrawn = [], isLoading } = useQuery({
    queryKey: ["books", "withdrawn"],
    queryFn: () => getBooks({ status: "Withdrawn" }),
  });

  const { data: foundBook, isFetching, error } = useQuery({
    queryKey: ["book-withdraw-lookup", lookupAccession],
    queryFn: () => getBookByAccession(lookupAccession!),
    enabled: !!lookupAccession,
    retry: false,
  });

  const withdrawMutation = useMutation({
    mutationFn: () => updateBookStatus(lookupAccession!, "Withdrawn"),
    onSuccess: () => {
      toast.success(`Book ${lookupAccession} withdrawn. Reason: ${reason}`);
      setAccessionNo(""); setReason(""); setLookupAccession(null);
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to withdraw"),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Withdraw Books" description="Withdraw damaged or obsolete books from inventory" />
      <div className="max-w-2xl mb-6">
        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Accession Number</Label>
              <Input placeholder="e.g. GVP/LIB/2024/001" value={accessionNo}
                onChange={e => setAccessionNo(e.target.value)}
                onKeyDown={e => e.key === "Enter" && setLookupAccession(accessionNo)} />
            </div>
            <Button onClick={() => setLookupAccession(accessionNo)} className="mt-6" disabled={isFetching || !accessionNo}>
              {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lookup"}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">Book not found.</p>}
          {foundBook && (
            <div className="space-y-3">
              <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                <div className="flex items-center gap-2 text-green-600 font-medium"><CheckCircle className="w-4 h-4" /> {foundBook.title}</div>
                <p className="text-muted-foreground">Status: {foundBook.status}</p>
              </div>
              {foundBook.status === "Withdrawn" ? (
                <p className="text-amber-600 text-sm">This book is already withdrawn.</p>
              ) : (
                <>
                  <div>
                    <Label>Reason for Withdrawal</Label>
                    <Select value={reason} onValueChange={setReason}>
                      <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                      <SelectContent>{WITHDRAW_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button variant="destructive" onClick={() => withdrawMutation.mutate()} disabled={!reason || withdrawMutation.isPending} className="w-full">
                    {withdrawMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing...</> : "Withdraw Book"}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <h3 className="text-base font-semibold mb-3">Withdrawn Books ({withdrawn.length})</h3>
      {withdrawn.length === 0 ? (
        <div className="bg-card rounded-xl p-8 border border-border/50 text-center">
          <p className="text-muted-foreground">No withdrawn books.</p>
        </div>
      ) : (
        <DataTable
          columns={[
            { header: "Accession No.", accessor: "accession_number" },
            { header: "Title", accessor: "title" },
            { header: "Author", accessor: (row: any) => row.author || "—" },
            { header: "Branch", accessor: (row: any) => row.library_branches?.name || "—" },
          ]}
          data={withdrawn}
        />
      )}
    </div>
  );
};

export default WithdrawBooks;
