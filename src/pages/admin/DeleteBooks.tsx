import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatsCard } from "@/components/StatsCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  BookOpen, Search, ChevronLeft, ChevronRight, Trash2, Loader2,
  AlertTriangle, ShieldAlert,
} from "lucide-react";
import { getBooksPaginated, getInventoryStats, checkBookDependencies, deleteBooks } from "@/lib/services/books";
import { getBranches } from "@/lib/services/branches";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const PAGE_SIZE = 100;

const DeleteBooks = () => {
  const queryClient = useQueryClient();
  const { adminBranch, isSuperAdmin } = useAuth();
  const branchId = isSuperAdmin ? null : (adminBranch?.branch_id ?? null);

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [searchField, setSearchField] = useState<"" | "accession_number" | "call_no" | "title" | "author" | "publisher" | "isbn">("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [searchError, setSearchError] = useState("");
  const effectiveBranchId = isSuperAdmin
    ? (selectedBranch === "all" ? null : Number(selectedBranch))
    : branchId;

  // Selection state
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string[]>([]);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [blockedBooks, setBlockedBooks] = useState<any[]>([]);

  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ["library-branches"],
    queryFn: getBranches,
  });

  // ── Stats ──
  const { data: stats } = useQuery({
    queryKey: ["inventory-stats", effectiveBranchId],
    queryFn: () => getInventoryStats(effectiveBranchId),
  });

  // ── Paginated books ──
  const { data: pageResult, isLoading, isFetching } = useQuery({
    queryKey: ["books-paged", effectiveBranchId, page, search, searchField],
    queryFn: () => getBooksPaginated({ page, pageSize: PAGE_SIZE, branch_id: effectiveBranchId, search: search || undefined, searchField: searchField || undefined }),
    placeholderData: (prev) => prev,
  });

  const books = pageResult?.data ?? [];
  const totalCount = pageResult?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const from = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE + PAGE_SIZE, totalCount);

  function handleSearch() {
    const value = inputVal.trim();
    if (!value) {
      setSearch("");
      setSearchError("");
      setPage(0);
      setSelected(new Set());
      return;
    }
    if (!searchField) {
      setSearchError("Select a field before searching.");
      return;
    }
    setSearchError("");
    setPage(0);
    setSearch(value);
    setSelected(new Set());
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  function clearSearch() {
    setInputVal("");
    setSearch("");
    setSearchError("");
    setPage(0);
    setSelected(new Set());
  }

  // ── Selection helpers ──
  function toggleSelect(accNo: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(accNo)) next.delete(accNo);
      else next.add(accNo);
      return next;
    });
  }

  function toggleSelectAll() {
    if (books.length === 0) return;
    const allOnPage = books.map((b: any) => b.accession_number);
    const allSelected = allOnPage.every((a: string) => selected.has(a));
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        allOnPage.forEach((a: string) => next.delete(a));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        allOnPage.forEach((a: string) => next.add(a));
        return next;
      });
    }
  }

  const allOnPageSelected = books.length > 0 && books.every((b: any) => selected.has(b.accession_number));

  // ── Initiate delete (single or bulk) ──
  async function initiateDelete(accessionNumbers: string[]) {
    if (accessionNumbers.length === 0) return;

    try {
      const blocked = await checkBookDependencies(accessionNumbers, effectiveBranchId);
      if (blocked.length > 0) {
        setBlockedBooks(blocked);
        setBlockedOpen(true);

        // Filter out blocked ones — allow the rest to proceed
        const blockedAccNos = new Set(blocked.map((b: any) => b.accession_number));
        const allowed = accessionNumbers.filter(a => !blockedAccNos.has(a));
        if (allowed.length === 0) return;
        setPendingDelete(allowed);
        // Don't open confirm yet; user must dismiss blocked dialog first
      } else {
        setPendingDelete(accessionNumbers);
        setConfirmOpen(true);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to check dependencies");
    }
  }

  // After dismissing blocked dialog, offer to continue with remaining books
  function handleBlockedDismiss() {
    setBlockedOpen(false);
    if (pendingDelete.length > 0) {
      setConfirmOpen(true);
    }
  }

  // ── Execute delete ──
  const deleteMutation = useMutation({
    mutationFn: (accNos: string[]) => deleteBooks(accNos, effectiveBranchId),
    onSuccess: (count) => {
      toast.success(`${count} book${count > 1 ? "s" : ""} deleted permanently`);
      setSelected(new Set());
      setPendingDelete([]);
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["books-paged"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
    },
    onError: (err: any) => toast.error(err.message || "Delete failed"),
  });

  function handleConfirmDelete() {
    setConfirmOpen(false);
    deleteMutation.mutate(pendingDelete);
  }

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Delete Books" description="Permanently remove books from inventory">
        {selected.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            disabled={deleteMutation.isPending}
            onClick={() => initiateDelete([...selected])}
          >
            {deleteMutation.isPending
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...</>
              : <><Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selected.size})</>
            }
          </Button>
        )}
      </PageHeader>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard title="Total Copies" value={stats?.total ?? "…"} icon={BookOpen} color="primary" />
        <StatsCard title="Available" value={stats?.available ?? "…"} icon={BookOpen} color="success" />
        <StatsCard title="Issued" value={stats?.issued ?? "…"} icon={BookOpen} color="info" />
        <StatsCard title="Lost" value={stats?.lost ?? "…"} icon={AlertTriangle} color="destructive" />
      </div>

      {/* ── Field-specific search ── */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_220px_auto_auto]">
          <div>
            <Label htmlFor="delete-search-field">Search field</Label>
            <Select value={searchField} onValueChange={(value) => { setSearchField(value as typeof searchField); setSearchError(""); }}>
              <SelectTrigger id="delete-search-field" className="mt-1"><SelectValue placeholder="Select field" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="accession_number">Accession Number</SelectItem><SelectItem value="call_no">Call Number</SelectItem>
                <SelectItem value="title">Title</SelectItem><SelectItem value="author">Author</SelectItem>
                <SelectItem value="publisher">Publisher</SelectItem><SelectItem value="isbn">ISBN</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="delete-search">Search value</Label>
            <div className="relative mt-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="delete-search" placeholder={searchField ? "Enter search value" : "Choose a field first"} className="pl-9" value={inputVal}
                onChange={e => { setInputVal(e.target.value); if (e.target.value.trim() && !searchField) setSearchError("Select a field before searching."); }} onKeyDown={handleKeyDown} />
            </div>
          </div>
          <div>
            <Label htmlFor="delete-branch">Branch</Label>
            <Select value={isSuperAdmin ? selectedBranch : (branchId == null ? "all" : String(branchId))} onValueChange={(value) => { setSelectedBranch(value); setPage(0); setSelected(new Set()); }} disabled={branchesLoading || !isSuperAdmin}>
              <SelectTrigger id="delete-branch" className="mt-1"><SelectValue placeholder="All branches" /></SelectTrigger>
              <SelectContent>
                {isSuperAdmin && <SelectItem value="all">All branches</SelectItem>}
                {(branches as any[]).filter(branch => isSuperAdmin || branch.id === branchId).map(branch => <SelectItem key={branch.id} value={String(branch.id)}>{branch.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button className="self-end" onClick={handleSearch}>Search</Button>
          {search && <Button className="self-end" variant="ghost" onClick={clearSearch}>Clear</Button>}
        </div>
        {searchError && <p className="mt-2 text-sm text-destructive">{searchError}</p>}
        {!searchField && !searchError && <p className="mt-2 text-xs text-muted-foreground">Choose a search field before entering a search value.</p>}
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : books.length === 0 ? (
        <div className="bg-card rounded-xl p-12 border border-border/50 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            {search ? `No books found for "${search}".` : "No books in inventory."}
          </p>
        </div>
      ) : (
        <>
          <div className={isFetching ? "opacity-60 transition-opacity" : ""}>
            <DataTable
              columns={[
                {
                  header: "",
                  accessor: (row: any) => (
                    <Checkbox
                      checked={selected.has(row.accession_number)}
                      onCheckedChange={() => toggleSelect(row.accession_number)}
                    />
                  ),
                  className: "w-10",
                },
                { header: "Accession No.", accessor: "accession_number" },
                { header: "Title", accessor: "title" },
                { header: "Author", accessor: (row: any) => row.author || "—" },
                { header: "Branch", accessor: (row: any) => row.library_branches?.name || "—" },
                { header: "Status", accessor: (row: any) => <StatusBadge status={row.status} /> },
                {
                  header: "Action",
                  accessor: (row: any) => (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={deleteMutation.isPending}
                      onClick={() => initiateDelete([row.accession_number])}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ),
                },
              ]}
              data={books}
            />
          </div>

          {/* ── Select all toggle + Pagination ── */}
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-1">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox checked={allOnPageSelected} onCheckedChange={toggleSelectAll} />
                <span className="text-xs font-medium">Select all on page</span>
              </label>
              {selected.size > 0 && (
                <span className="text-xs text-primary font-medium">{selected.size} selected</span>
              )}
              <span className="text-xs">
                Showing <span className="font-medium text-foreground">{from}–{to}</span> of{" "}
                <span className="font-medium text-foreground">{totalCount.toLocaleString()}</span>
                {isFetching && <Loader2 className="inline w-3 h-3 animate-spin ml-2" />}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage(0)} disabled={page === 0} className="px-2" title="First page">«</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="gap-1">
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </Button>
              <span className="px-3 py-1 rounded border border-border bg-muted/50 text-xs font-medium">
                {page + 1} / {totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="gap-1">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} className="px-2" title="Last page">»</Button>
            </div>
          </div>
        </>
      )}

      {/* ── Blocked Books Dialog ── */}
      <AlertDialog open={blockedOpen} onOpenChange={setBlockedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="w-5 h-5" /> Cannot Delete — Book Currently Issued
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  The following books are currently issued to a student or faculty member.
                  Return them before deleting the inventory copy.
                </p>
                <div className="max-h-48 overflow-y-auto rounded-md border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Accession No.</th>
                        <th className="text-left px-3 py-2 font-medium">Issued To</th>
                        <th className="text-left px-3 py-2 font-medium">Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blockedBooks.map((b: any, i: number) => (
                        <tr key={i} className="border-t border-border/50">
                          <td className="px-3 py-2 font-mono text-xs">{b.accession_number}</td>
                          <td className="px-3 py-2">{b.user_id}</td>
                          <td className="px-3 py-2">{b.due_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {pendingDelete.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {pendingDelete.length} other book(s) can still be deleted.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleBlockedDismiss}>
              {pendingDelete.length > 0 ? "Continue with remaining" : "OK"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Confirm Delete Dialog ── */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" /> Confirm Permanent Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-foreground">{pendingDelete.length} book{pendingDelete.length > 1 ? "s" : ""}</span>?
              This action cannot be undone. All records will be permanently removed from the inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setConfirmOpen(false); setPendingDelete([]); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DeleteBooks;
