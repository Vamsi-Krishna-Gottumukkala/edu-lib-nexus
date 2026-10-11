import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { DataTable } from "@/components/DataTable";
import { Search, Loader2, BookOpen, Clock, User } from "lucide-react";
import { getBookByAccession, getBookHistory } from "@/lib/services/books";
import { getIssuedBooks } from "@/lib/services/issues";
import { useAuth } from "@/contexts/AuthContext";
import { fmtDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

type SearchMode = "accession" | "student";

export default function BookLookup() {
  const { adminBranch, isSuperAdmin } = useAuth();
  const branchId = isSuperAdmin ? null : (adminBranch?.branch_id ?? null);
  
  const [searchMode, setSearchMode] = useState<SearchMode>("accession");
  const [searchInput, setSearchInput] = useState("");
  const [lookupValue, setLookupValue] = useState<string | null>(null);

  // ── Accession Number lookup ──
  const { data: book, isFetching: bookFetching, error: bookError } = useQuery({
    queryKey: ["book-lookup", lookupValue, branchId],
    queryFn: () => getBookByAccession(lookupValue!, branchId),
    enabled: !!lookupValue && searchMode === "accession",
    retry: false,
  });

  const { data: history, isFetching: historyFetching } = useQuery({
    queryKey: ["book-history", lookupValue],
    queryFn: () => getBookHistory(lookupValue!),
    enabled: !!lookupValue && searchMode === "accession" && !!book,
  });

  // ── Student ID lookup ──
  const { data: studentBooks = [], isFetching: studentFetching, error: studentError } = useQuery({
    queryKey: ["student-books-lookup", lookupValue, branchId],
    queryFn: () => getIssuedBooks(lookupValue!, branchId),
    enabled: !!lookupValue && searchMode === "student",
    retry: false,
  });

  const isFetching = bookFetching || studentFetching;
  const error = searchMode === "accession" ? bookError : studentError;

  function handleSearch() {
    const val = searchInput.trim();
    if (!val) return;
    setLookupValue(val);
  }

  function handleModeSwitch(mode: SearchMode) {
    setSearchMode(mode);
    setSearchInput("");
    setLookupValue(null);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Book Status Search" description="Look up a book's current status, issue history, or check student's issued books" />
      
      <div className="bg-card rounded-xl p-5 border border-border/50 shadow-sm max-w-xl space-y-4">
        {/* Search Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={searchMode === "accession" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeSwitch("accession")}
          >
            <BookOpen className="w-3.5 h-3.5 mr-1.5" /> By Accession No.
          </Button>
          <Button
            variant={searchMode === "student" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeSwitch("student")}
          >
            <User className="w-3.5 h-3.5 mr-1.5" /> By Student ID
          </Button>
        </div>

        <div>
          <Label className="text-sm font-semibold mb-2 block">
            {searchMode === "accession" ? "Search by Accession Number" : "Search by Student / Faculty ID"}
          </Label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder={searchMode === "accession" ? "e.g. 10042" : "e.g. 23500136"} 
                className="pl-9"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isFetching || !searchInput.trim()}>
              {isFetching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Search
            </Button>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">
            {searchMode === "accession" ? "Book not found or access denied." : "No active issues found for this ID."}
          </p>}
        </div>
      </div>

      {/* ── Accession Number Results ── */}
      {searchMode === "accession" && book && (
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

      {/* ── Student ID Results ── */}
      {searchMode === "student" && lookupValue && !studentFetching && (
        <Card>
          <CardContent className="p-0">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Books Currently Issued to {lookupValue}
              </h3>
              <span className="text-sm text-muted-foreground">{studentBooks.length} book{studentBooks.length !== 1 ? "s" : ""}</span>
            </div>
            
            {studentBooks.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No active issued books found for this user.</p>
              </div>
            ) : (
              <DataTable 
                columns={[
                  { header: "Accession No.", accessor: "accession_number" },
                  { header: "Title", accessor: (r: any) => r.book_copies?.title || "—" },
                  { header: "Author", accessor: (r: any) => r.book_copies?.author || "—" },
                  { header: "Issue Date", accessor: (r: any) => fmtDate(r.issue_date) },
                  { header: "Due Date", accessor: (r: any) => {
                    const isOverdue = new Date(r.due_date) < new Date();
                    return (
                      <span className={isOverdue ? "text-red-500 font-semibold" : ""}>
                        {fmtDate(r.due_date)}{isOverdue ? " ⚠ Overdue" : ""}
                      </span>
                    );
                  }},
                ]}
                data={studentBooks}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
