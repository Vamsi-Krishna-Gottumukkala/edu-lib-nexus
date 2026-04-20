import React, { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBookByAccession, updateBook } from "@/lib/services/books";
import { getBranches } from "@/lib/services/branches";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";

const TransferBook = () => {
  const queryClient = useQueryClient();
  const [accessionNo, setAccessionNo] = useState("");
  const [lookupAccession, setLookupAccession] = useState<string | null>(null);
  const [toBranchId, setToBranchId] = useState("");

  const { data: branches = [] } = useQuery({ queryKey: ["branches"], queryFn: getBranches });

  const { data: foundBook, isFetching, error } = useQuery({
    queryKey: ["book-transfer-lookup", lookupAccession],
    queryFn: () => getBookByAccession(lookupAccession!),
    enabled: !!lookupAccession,
    retry: false,
  });

  const transferMutation = useMutation({
    mutationFn: () =>
      updateBook(lookupAccession!, {
        branch_id: parseInt(toBranchId),
        status: "Transferred",
      }),
    onSuccess: () => {
      const branch = (branches as any[]).find(b => String(b.id) === toBranchId);
      toast.success(`Book transferred to ${branch?.name || "new branch"} successfully!`);
      setAccessionNo(""); setLookupAccession(null); setToBranchId("");
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
    onError: (err: any) => toast.error(err.message || "Transfer failed"),
  });

  const handleTransfer = () => {
    if (!foundBook || !toBranchId) { toast.error("Please lookup book and select target branch"); return; }
    if (String(foundBook.branch_id) === toBranchId) {
      toast.error("Book is already in this branch"); return;
    }
    transferMutation.mutate();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Transfer Book" description="Transfer book between library branches" />
      <div className="max-w-2xl space-y-6">
        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
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
            <Button onClick={() => setLookupAccession(accessionNo)} className="mt-6" disabled={isFetching || !accessionNo}>
              {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lookup"}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">Book not found.</p>}
          {foundBook && (
            <>
              <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                <div className="flex items-center gap-2 text-green-600 font-medium mb-1"><CheckCircle className="w-4 h-4" /> Book Found</div>
                <p><span className="font-medium">Title:</span> {foundBook.title}</p>
                <p><span className="font-medium">Current Branch:</span> {(foundBook as any).library_branches?.name || "—"}</p>
                <p><span className="font-medium">Status:</span> {foundBook.status}</p>
              </div>
              <div>
                <Label>Transfer To Branch</Label>
                <Select value={toBranchId} onValueChange={setToBranchId}>
                  <SelectTrigger><SelectValue placeholder="Select target branch" /></SelectTrigger>
                  <SelectContent>
                    {(branches as any[])
                      .filter(b => String(b.id) !== String(foundBook.branch_id))
                      .map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleTransfer} className="w-full" disabled={transferMutation.isPending || !toBranchId}>
                {transferMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Transferring...</> : "Transfer Book"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransferBook;
