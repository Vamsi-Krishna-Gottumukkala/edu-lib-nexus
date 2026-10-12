import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { DataTable } from "@/components/DataTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, BookOpen, Clock, User } from "lucide-react";
import {
  getBookByAccession,
  getBookHistory,
  getBooks,
  BookSearchField,
} from "@/lib/services/books";
import { getUserCirculationHistory } from "@/lib/services/issues";
import { getUserById } from "@/lib/services/users";
import { getBranches } from "@/lib/services/branches";
import { useAuth } from "@/contexts/AuthContext";
import { fmtDate } from "@/lib/utils";

type SearchMode = "book" | "user";

type BookSearchFieldType =
  | ""
  | "accession_number"
  | "title"
  | "author"
  | "call_no"
  | "isbn"
  | "publisher";

export default function BookLookup() {
  const { adminBranch, isSuperAdmin } = useAuth();
  const branchId = isSuperAdmin ? null : (adminBranch?.branch_id ?? null);

  const [searchMode, setSearchMode] = useState<SearchMode>("book");

  // ── Book Search Mode State ──
  const [bookSearchField, setBookSearchField] = useState<BookSearchFieldType>("");
  const [bookSearchInput, setBookSearchInput] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>(
    isSuperAdmin ? "all" : String(branchId ?? "all")
  );
  const [bookSearchError, setBookSearchError] = useState("");
  const [activeBookQuery, setActiveBookQuery] = useState<{
    field: BookSearchFieldType;
    value: string;
    branchId: number | null;
  } | null>(null);

  // ── User Search Mode State (By Student ID / By Faculty ID) ──
  const [userSearchInput, setUserSearchInput] = useState("");
  const [userSearchError, setUserSearchError] = useState("");
  const [activeUserQuery, setActiveUserQuery] = useState<string | null>(null);

  // Load branches
  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ["library-branches"],
    queryFn: getBranches,
  });

  const effectiveBranchId = isSuperAdmin
    ? (selectedBranch === "all" ? null : Number(selectedBranch))
    : branchId;

  // ── 1. Accession Number Lookup Query ──
  const isAccessionLookup = activeBookQuery?.field === "accession_number";
  const {
    data: book,
    isFetching: bookFetching,
    error: bookError,
  } = useQuery({
    queryKey: ["book-lookup", activeBookQuery?.value, activeBookQuery?.branchId],
    queryFn: () =>
      getBookByAccession(activeBookQuery!.value, activeBookQuery?.branchId),
    enabled: !!isAccessionLookup && !!activeBookQuery?.value,
    retry: false,
  });

  const { data: history, isFetching: historyFetching } = useQuery({
    queryKey: ["book-history", activeBookQuery?.value],
    queryFn: () => getBookHistory(activeBookQuery!.value),
    enabled: !!isAccessionLookup && !!activeBookQuery?.value && !!book,
  });

  // ── 2. Catalog Search Query (Title / Author / Call No / ISBN / Publisher) ──
  const isCatalogLookup =
    activeBookQuery &&
    ["title", "author", "call_no", "isbn", "publisher"].includes(
      activeBookQuery.field
    );

  const {
    data: catalogBooks = [],
    isFetching: catalogFetching,
    error: catalogError,
  } = useQuery({
    queryKey: [
      "books-catalog-lookup",
      activeBookQuery?.value,
      activeBookQuery?.field,
      activeBookQuery?.branchId,
    ],
    queryFn: () =>
      getBooks({
        search: activeBookQuery!.value,
        searchField: activeBookQuery!.field as BookSearchField,
        branch_id: activeBookQuery?.branchId,
      }),
    enabled: !!isCatalogLookup,
    retry: false,
  });

  // ── 3. User Lookup Queries (Student ID / Faculty ID) ──
  const {
    data: userInfo,
    isFetching: userInfoFetching,
  } = useQuery({
    queryKey: ["user-info-lookup", activeUserQuery, branchId],
    queryFn: async () => {
      try {
        return await getUserById(activeUserQuery!, branchId);
      } catch {
        return null;
      }
    },
    enabled: !!activeUserQuery && searchMode === "user",
    retry: false,
  });

  const {
    data: userBooks = [],
    isFetching: userBooksFetching,
    error: userBooksError,
  } = useQuery({
    queryKey: ["user-books-history", activeUserQuery, branchId],
    queryFn: () => getUserCirculationHistory(activeUserQuery!, branchId),
    enabled: !!activeUserQuery && searchMode === "user",
    retry: false,
  });

  const isBookFetching = bookFetching || catalogFetching || historyFetching;
  const isUserFetching = userInfoFetching || userBooksFetching;

  function handleBookSearch() {
    const val = bookSearchInput.trim();
    if (!bookSearchField) {
      setBookSearchError("Choose a search field before entering a search value.");
      return;
    }
    if (!val) {
      setBookSearchError("Please enter a search value.");
      return;
    }

    setBookSearchError("");
    setActiveBookQuery({
      field: bookSearchField,
      value: val,
      branchId: effectiveBranchId,
    });
  }

  function handleUserSearch() {
    const val = userSearchInput.trim();
    if (!val) {
      setUserSearchError("Please enter a Student ID or Faculty ID.");
      return;
    }
    setUserSearchError("");
    setActiveUserQuery(val);
  }

  function handleModeSwitch(mode: SearchMode) {
    setSearchMode(mode);
    setBookSearchError("");
    setUserSearchError("");
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Book Status Search"
        description="Look up book status, circulation history, or student / faculty records"
      />

      {/* ── Mode Toggle: By Book Details. vs By Student ID / By Faculty ID ── */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={searchMode === "book" ? "default" : "outline"}
          size="sm"
          onClick={() => handleModeSwitch("book")}
          className="gap-1.5"
        >
          <BookOpen className="w-3.5 h-3.5" /> By Book Details
        </Button>
        <Button
          variant={searchMode === "user" ? "default" : "outline"}
          size="sm"
          onClick={() => handleModeSwitch("user")}
          className="gap-1.5"
        >
          <User className="w-3.5 h-3.5" /> By Student ID / By Faculty ID
        </Button>
      </div>

      {/* ═══════════════ MODE A: By Book / Accession No. ═══════════════ */}
      {searchMode === "book" && (
        <>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[220px_minmax(0,1fr)_220px_auto]">
              <div>
                <Label htmlFor="lookup-field">Search field</Label>
                <Select
                  value={bookSearchField}
                  onValueChange={(val) => {
                    setBookSearchField(val as BookSearchFieldType);
                    setBookSearchError("");
                  }}
                >
                  <SelectTrigger id="lookup-field" className="mt-1">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accession_number">Accession Number</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="author">Author</SelectItem>
                    <SelectItem value="call_no">Call Number</SelectItem>
                    <SelectItem value="isbn">ISBN</SelectItem>
                    <SelectItem value="publisher">Publisher</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="lookup-search">Search value</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="lookup-search"
                    placeholder={
                      bookSearchField
                        ? bookSearchField === "accession_number"
                          ? "e.g. 10042"
                          : "Enter search value"
                        : "Choose a field first"
                    }
                    className="pl-9"
                    value={bookSearchInput}
                    onChange={(e) => {
                      setBookSearchInput(e.target.value);
                      if (e.target.value.trim() && !bookSearchField) {
                        setBookSearchError("Select a field before searching.");
                      } else {
                        setBookSearchError("");
                      }
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleBookSearch()}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="lookup-branch">Branch</Label>
                <Select
                  value={
                    isSuperAdmin
                      ? selectedBranch
                      : branchId == null
                      ? "all"
                      : String(branchId)
                  }
                  onValueChange={setSelectedBranch}
                  disabled={branchesLoading || !isSuperAdmin}
                >
                  <SelectTrigger id="lookup-branch" className="mt-1">
                    <SelectValue
                      placeholder={
                        branchesLoading ? "Loading branches…" : "All branches"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {isSuperAdmin && <SelectItem value="all">All branches</SelectItem>}
                    {(branches as any[])
                      .filter((branch) => isSuperAdmin || branch.id === branchId)
                      .map((branch) => (
                        <SelectItem key={branch.id} value={String(branch.id)}>
                          {branch.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="self-end"
                onClick={handleBookSearch}
                disabled={isBookFetching}
              >
                {isBookFetching && (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                )}
                Search
              </Button>
            </div>

            {bookSearchError && (
              <p className="mt-2 text-sm text-destructive">{bookSearchError}</p>
            )}
            {!bookSearchField && !bookSearchError && (
              <p className="mt-2 text-xs text-muted-foreground">
                Choose a search field before entering a search value.
              </p>
            )}
          </div>

          {/* Accession Lookup Error */}
          {isAccessionLookup && bookError && !bookFetching && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 text-sm">
              Book not found with accession number "{activeBookQuery?.value}" or access denied for this campus.
            </div>
          )}

          {/* Catalog Lookup Error */}
          {isCatalogLookup && catalogError && !catalogFetching && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 text-sm">
              Failed to query books catalog. Please try again.
            </div>
          )}

          {/* Catalog Search Results (Title / Author / Call No / ISBN / Publisher) */}
          {isCatalogLookup && activeBookQuery && !catalogFetching && (
            <Card>
              <CardContent className="p-0">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" /> Matching Books — {catalogBooks.length} found
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Showing matching copies in inventory
                  </span>
                </div>

                {catalogBooks.length === 0 ? (
                  <div className="p-10 text-center text-muted-foreground">
                    <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>No books found matching "{activeBookQuery.value}".</p>
                  </div>
                ) : (
                  <DataTable
                    columns={[
                      { header: "Accession No.", accessor: "accession_number" },
                      { header: "Title", accessor: "title" },
                      { header: "Author", accessor: (r: any) => r.author || "—" },
                      { header: "Call No.", accessor: (r: any) => r.call_no || "—" },
                      {
                        header: "Branch",
                        accessor: (r: any) => r.library_branches?.name || "—",
                      },
                      {
                        header: "Status",
                        accessor: (r: any) => <StatusBadge status={r.status} />,
                      },
                    ]}
                    data={catalogBooks}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Accession Number Result: Details Card + Circulation History */}
          {isAccessionLookup && book && (
            <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-card-foreground leading-tight">
                        {book.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        {book.author}
                      </p>
                    </div>
                    <StatusBadge status={book.status} />
                  </div>
                  <div className="space-y-2 pt-4 border-t border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Accession No.</span>
                      <span className="font-medium font-mono">
                        {book.accession_number}
                      </span>
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
                      <span className="font-medium">
                        {book.library_branches?.name || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Publisher</span>
                      <span className="font-medium">{book.publisher || "—"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  <div className="p-5 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" /> Circulation History
                    </h3>
                    {historyFetching && (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {!history || history.issues.length === 0 ? (
                    <div className="p-10 text-center text-muted-foreground">
                      <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p>No circulation history found for this book copy.</p>
                    </div>
                  ) : (
                    <DataTable
                      columns={[
                        {
                          header: "Issued To",
                          accessor: (r: any) => (
                            <div>
                              <span className="font-medium block text-foreground">
                                {r.users?.user_name || "—"}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono block">
                                Roll No: {r.user_id || r.users?.user_id || "—"}
                                {r.users?.user_type ? ` (${r.users.user_type})` : ""}
                              </span>
                            </div>
                          ),
                        },
                        {
                          header: "Issue Date",
                          accessor: (r: any) => fmtDate(r.issue_date),
                        },
                        {
                          header: "Due Date",
                          accessor: (r: any) => fmtDate(r.due_date),
                        },
                        {
                          header: "Return Date",
                          accessor: (r: any) =>
                            r.is_returned && r.return_date ? (
                              <span className="font-medium text-foreground">
                                {fmtDate(r.return_date)}
                              </span>
                            ) : (
                              <StatusBadge status="Issued" />
                            ),
                        },
                        {
                          header: "Fine",
                          accessor: (r: any) =>
                            r.fine_amount ? `₹${r.fine_amount}` : "—",
                        },
                      ]}
                      data={history.issues}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* ═══════════════ MODE B: By Student ID / By Faculty ID ═══════════════ */}
      {searchMode === "user" && (
        <>
          <div className="rounded-lg border border-border bg-card p-4 max-w-xl">
            <Label htmlFor="user-id-search">
              Search by Student ID / Faculty ID
            </Label>
            <div className="flex gap-3 mt-1.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="user-id-search"
                  placeholder="e.g. 5221411006 or 23500136"
                  className="pl-9"
                  value={userSearchInput}
                  onChange={(e) => {
                    setUserSearchInput(e.target.value);
                    setUserSearchError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleUserSearch()}
                />
              </div>
              <Button onClick={handleUserSearch} disabled={isUserFetching}>
                {isUserFetching && (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                )}
                Search
              </Button>
            </div>
            {userSearchError && (
              <p className="mt-2 text-sm text-destructive">{userSearchError}</p>
            )}
          </div>

          {activeUserQuery && !isUserFetching && (
            <Card>
              <CardContent className="p-0">
                <div className="p-5 border-b border-border flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span>
                      Books Currently Issued to{" "}
                      {userInfo?.user_type === "faculty" ? "Faculty ID" : "Roll No"}:{" "}
                      <span className="font-mono">{activeUserQuery}</span>
                    </span>
                    {userInfo?.user_name ? (
                      <span className="text-primary font-bold">
                        {" "}— {userInfo.user_name}
                      </span>
                    ) : null}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {userBooks.length} record{userBooks.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {userBooks.length === 0 ? (
                  <div className="p-10 text-center text-muted-foreground">
                    <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>No books currently issued or history found for this ID.</p>
                  </div>
                ) : (
                  <DataTable
                    columns={[
                      { header: "Accession No.", accessor: "accession_number" },
                      {
                        header: "Title",
                        accessor: (r: any) =>
                          r.book_copies?.title || r.book_title || "—",
                      },
                      {
                        header: "Author",
                        accessor: (r: any) =>
                          r.book_copies?.author || r.book_author || "—",
                      },
                      {
                        header: "Issue Date",
                        accessor: (r: any) => fmtDate(r.issue_date),
                      },
                      {
                        header: "Due Date",
                        accessor: (r: any) => {
                          const isOverdue =
                            !r.is_returned && new Date(r.due_date) < new Date();
                          return (
                            <span
                              className={
                                isOverdue ? "text-red-500 font-semibold" : ""
                              }
                            >
                              {fmtDate(r.due_date)}
                              {isOverdue ? " ⚠ Overdue" : ""}
                            </span>
                          );
                        },
                      },
                      {
                        header: "Return Date",
                        accessor: (r: any) =>
                          r.is_returned && r.return_date ? (
                            <span className="font-medium text-foreground">
                              {fmtDate(r.return_date)}
                            </span>
                          ) : (
                            <StatusBadge status="Issued" />
                          ),
                      },
                    ]}
                    data={userBooks}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
