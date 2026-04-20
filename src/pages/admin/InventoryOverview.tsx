import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatsCard } from "@/components/StatsCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, BookCopy, AlertTriangle, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { getBooksPaginated, getInventoryStats } from "@/lib/services/books";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const PAGE_SIZE = 100;

const InventoryOverview = () => {
  const { adminBranch, isSuperAdmin } = useAuth();
  const branchId = isSuperAdmin ? null : (adminBranch?.branch_id ?? null);

  const [page, setPage]     = useState(0);
  const [search, setSearch] = useState("");
  const [inputVal, setInputVal] = useState("");

  // ── Stats (exact server-side COUNT) ──────────────────────────
  const { data: stats } = useQuery({
    queryKey: ["inventory-stats", branchId],
    queryFn:  () => getInventoryStats(branchId),
  });

  // ── Paginated books ───────────────────────────────────────────
  const { data: pageResult, isLoading, isFetching } = useQuery({
    queryKey: ["books-paged", branchId, page, search],
    queryFn:  () => getBooksPaginated({ page, pageSize: PAGE_SIZE, branch_id: branchId, search: search || undefined }),
    placeholderData: (prev) => prev,   // keep previous page visible while fetching
  });

  const books      = pageResult?.data       ?? [];
  const totalCount = pageResult?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const from       = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE + PAGE_SIZE, totalCount);

  function handleSearch() {
    setPage(0);
    setSearch(inputVal.trim());
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  function clearSearch() {
    setInputVal("");
    setSearch("");
    setPage(0);
  }

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Inventory Overview" description="Complete book inventory with accession tracking" />

      {/* ── Stats cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard title="Total Copies"  value={stats?.total     ?? "…"} icon={BookOpen}     color="primary" />
        <StatsCard title="Available"     value={stats?.available  ?? "…"} icon={BookCopy}     color="success" />
        <StatsCard title="Issued"        value={stats?.issued     ?? "…"} icon={BookOpen}     color="info"    />
        <StatsCard title="Lost"          value={stats?.lost       ?? "…"} icon={AlertTriangle} color="destructive" />
      </div>

      {/* ── Search bar ──────────────────────────────────────────── */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, author, accession no…"
            className="pl-9"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button size="sm" onClick={handleSearch}>Search</Button>
        {search && (
          <Button size="sm" variant="ghost" onClick={clearSearch}>Clear</Button>
        )}
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : books.length === 0 ? (
        <div className="bg-card rounded-xl p-12 border border-border/50 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            {search ? `No books found for "${search}".` : "No books in inventory yet. Add books using the Add Book page."}
          </p>
        </div>
      ) : (
        <>
          <div className={isFetching ? "opacity-60 transition-opacity" : ""}>
            <DataTable
              columns={[
                { header: "Accession No.", accessor: "accession_number" },
                { header: "Call No.",  accessor: (row: any) => row.call_no               || "—" },
                { header: "Title",     accessor: "title" },
                { header: "Author",    accessor: (row: any) => row.author                || "—" },
                { header: "Publisher", accessor: (row: any) => row.publisher             || "—" },
                { header: "Year",      accessor: (row: any) => row.year_of_publication   || "—" },
                { header: "Branch",    accessor: (row: any) => row.library_branches?.name || "—" },
                { header: "Status",    accessor: (row: any) => <StatusBadge status={row.status} /> },
              ]}
              data={books.filter((b: any) => b.status !== "Withdrawn")}
            />
          </div>

          {/* ── Pagination controls ─────────────────────────────── */}
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-1">
            <span>
              Showing <span className="font-medium text-foreground">{from}–{to}</span> of{" "}
              <span className="font-medium text-foreground">{totalCount.toLocaleString()}</span> entries
              {isFetching && <Loader2 className="inline w-3 h-3 animate-spin ml-2" />}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline" size="sm"
                onClick={() => setPage(0)}
                disabled={page === 0}
                className="px-2"
                title="First page"
              >
                «
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </Button>
              <span className="px-3 py-1 rounded border border-border bg-muted/50 text-xs font-medium">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline" size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => setPage(totalPages - 1)}
                disabled={page >= totalPages - 1}
                className="px-2"
                title="Last page"
              >
                »
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InventoryOverview;
