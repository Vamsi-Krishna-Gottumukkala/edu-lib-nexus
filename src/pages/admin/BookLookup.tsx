import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { DataTable } from "@/components/DataTable";
import { Search, Loader2, BookOpen, Clock, User, CalendarDays } from "lucide-react";
import { getBookByAccession, getBookHistory } from "@/lib/services/books";
import { useAuth } from "@/contexts/AuthContext";
import { fmtDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export default function BookLookup() {
  const { adminBranch, isSuperAdmin } = useAuth();
  const branchId = isSuperAdmin ? null : (adminBranch?.branch_id ?? null);
  
  const [accessionNo, setAccessionNo] = useState("");
  const [lookupAccession, setLookupAccession] = useState<string | null>(null);

  const { data: book, isFetching, error } = useQuery({
    queryKey: ["book-lookup", lookupAccession, branchId],
    queryFn: () => getBookByAccession(lookupAccession!, branchId),
    enabled: !!lookupAccession,
    retry: false,
  });

  const { data: history, isFetching: historyFetching } = useQuery({
    queryKey: ["book-history", lookupAccession],
    queryFn: () => getBookHistory(lookupAccession!),
    enabled: !!lookupAccession && !!book,
  });

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Book Status Search" description="Look up a book's current status and issue history" />
      
      <div className="bg-card rounded-xl p-5 border border-border/50 shadow-sm max-w-xl">
        <Label className="text-sm font-semibold mb-2 block">Search by Accession Number</Label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="e.g. 10042" 
              className="pl-9"
              value={accessionNo}
              onChange={e => setAccessionNo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setLookupAccession(accessionNo.trim())}
            />
          </div>
          <Button onClick={() => setLookupAccession(accessionNo.trim())} disabled={isFetching || !accessionNo.trim()}>
            {isFetching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Search
          </Button>
        </div>
        {error && <p className="mt-3 text-sm text-destructive">Book not found or access denied.</p>}
      </div>

      {book && (
        <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
          {/* Book Details Card */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-card-foreground leading-tight">{book.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{book.author}</p>
                </div>
                <StatusBadge status={book.status} />
              </div>
              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Accession No.</span>
                  <span className="font-medium">{book.accession_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Call No.</span>
                  <span className="font-medium">{book.call_no || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ISBN</span>
                  <span className="font-medium">{book.isbn || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Branch</span>
                  <span className="font-medium">{book.library_branches?.name || "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issue History Table */}
          <Card>
            <CardContent className="p-0">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Circulation History
                </h3>
                {historyFetching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              </div>
              
              {!history || history.issues.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>No circulation history found for this book.</p>
                </div>
              ) : (
                <DataTable 
                  columns={[
                    { header: "Issued To", accessor: (r: any) => (
                      <div>
                        <span className="font-medium block">{r.users?.user_name}</span>
                        <span className="text-xs text-muted-foreground capitalize">{r.users?.user_type}</span>
                      </div>
                    )},
                    { header: "Issue Date", accessor: (r: any) => fmtDate(r.issue_date) },
                    { header: "Due Date", accessor: (r: any) => fmtDate(r.due_date) },
                    { header: "Return Date", accessor: (r: any) => r.is_returned ? fmtDate(r.return_date) : <StatusBadge status="Issued" /> },
                    { header: "Fine", accessor: (r: any) => r.fine_amount ? `₹${r.fine_amount}` : "—" },
                  ]}
                  data={history.issues}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
