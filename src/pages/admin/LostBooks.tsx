import React, { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBooks, getBookByAccession, updateBookStatus } from "@/lib/services/books";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { DataTable } from "@/components/DataTable";

const LostBooks = () => {
  const queryClient = useQueryClient();
  const [accessionNo, setAccessionNo] = useState("");
  const [lookupAccession, setLookupAccession] = useState<string | null>(null);

  const { data: lostBooks = [], isLoading: lostLoading } = useQuery({
    queryKey: ["books", "lost"],
    queryFn: () => getBooks({ status: "Lost" }),
  });

  const { data: foundBook, isFetching, error } = useQuery({
    queryKey: ["book-lost-lookup", lookupAccession],
    queryFn: () => getBookByAccession(lookupAccession!),
    enabled: !!lookupAccession,
    retry: false,
  });

  const markLostMutation = useMutation({
    mutationFn: () => updateBookStatus(lookupAccession!, "Lost"),
    onSuccess: () => {
      toast.success(`Book ${lookupAccession} marked as Lost`);
      setAccessionNo(""); setLookupAccession(null);
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to mark as lost"),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Lost Books" description="Mark and track lost book copies" />
      <div className="max-w-2xl mb-6">
        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
          <h3 className="text-sm font-semibold text-card-foreground">Mark Book as Lost</h3>
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
            <div className="space-y-3">
              <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                <div className="flex items-center gap-2 text-green-600 font-medium"><CheckCircle className="w-4 h-4" /> Book Found</div>
                <p><span className="font-medium">Title:</span> {foundBook.title}</p>
                <p><span className="font-medium">Current Status:</span> {foundBook.status}</p>
              </div>
              {foundBook.status === "Lost" ? (
                <p className="text-amber-600 text-sm">This book is already marked as Lost.</p>
              ) : (
                <Button variant="destructive" onClick={() => markLostMutation.mutate()} disabled={markLostMutation.isPending} className="w-full">
                  {markLostMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing...</> : "Mark as Lost"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-destructive" /> Lost Books Records ({lostBooks.length})
      </h3>
      {lostLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : lostBooks.length === 0 ? (
        <div className="bg-card rounded-xl p-8 border border-border/50 text-center">
          <p className="text-muted-foreground">No lost books on record.</p>
        </div>
      ) : (
        <DataTable
          columns={[
            { header: "Accession No.", accessor: "accession_number" },
            { header: "Title", accessor: "title" },
            { header: "Author", accessor: (row: any) => row.author || "—" },
            { header: "Branch", accessor: (row: any) => row.library_branches?.name || "—" },
          ]}
          data={lostBooks}
        />
      )}
    </div>
  );
};

export default LostBooks;
