import React, { useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addBook, bulkInsertBooks } from "@/lib/services/books";
import { getBranches } from "@/lib/services/branches";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, PlusCircle, Upload } from "lucide-react";
import * as XLSX from "xlsx";

const SOURCES = ["Purchase", "Donation", "Exchange", "Grant"];

const emptyForm = {
  accession_number: "", title: "", author: "", isbn: "",
  branch_id: "", publisher: "", year_of_publication: "", edition: "",
  call_no: "", cost: "", source: "", book_no: "", acquisition_date: "",
  place_of_publication: "",
};

const AddBook = () => {
  const queryClient = useQueryClient();
  const { adminBranch, isSuperAdmin } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  // For branch admins, pre-lock the branch to their campus
  const lockedBranchId = adminBranch?.branch_id;

  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: getBranches,
  });

  const effectiveBranchId = lockedBranchId
    ? String(lockedBranchId)
    : form.branch_id;

  const addMutation = useMutation({
    mutationFn: () =>
      addBook({
        accession_number: form.accession_number,
        title: form.title,
        author: form.author || null,
        isbn: form.isbn || null,
        branch_id: effectiveBranchId ? parseInt(effectiveBranchId) : null,
        publisher: form.publisher || null,
        year_of_publication: form.year_of_publication ? parseInt(form.year_of_publication) : null,
        edition: form.edition || null,
        call_no: form.call_no || null,
        cost: form.cost ? parseFloat(form.cost) : null,
        source: form.source || null,
        status: "Available",
        book_no: form.book_no || null,
        acquisition_date: form.acquisition_date || null,
        place_of_publication: form.place_of_publication || null,
      }),
    onSuccess: () => {
      toast.success(`"${form.title}" added to inventory!`);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to add book"),
  });

  const handleSubmit = () => {
    if (!form.accession_number || !form.title) {
      toast.error("Accession Number and Title are required");
      return;
    }
    addMutation.mutate();
  };

  const upd = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  // ── Bulk Excel upload ──────────────────────────────────────
  async function handleExcelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw: any[] = XLSX.utils.sheet_to_json(ws);

      const rows = raw.map((r: any) => {
        // Helper to find a value regardless of header case or trailing spaces
        const getVal = (keys: string[]) => {
          for (const key of Object.keys(r)) {
            if (keys.some(k => k.toLowerCase() === key.trim().toLowerCase())) {
              return r[key];
            }
          }
          return undefined;
        };

        // ─── Date parser: handles dd-mm-yyyy, dd/mm/yyyy, Excel serial, ISO ───
        const parseDate = (rawVal: any): string | null => {
          if (!rawVal) return null;
          const s = String(rawVal).trim();
          if (!s) return null;
          // Excel serial number (e.g. 42931)
          if (/^\d{5}$/.test(s)) {
            const d = XLSX.SSF.parse_date_code(parseInt(s));
            if (d) return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
          }
          // dd-mm-yyyy or dd/mm/yyyy
          const dmy = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
          if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;
          // yyyy-mm-dd already
          const ymd = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
          if (ymd) return `${ymd[1]}-${ymd[2].padStart(2,'0')}-${ymd[3].padStart(2,'0')}`;
          return null; // unrecognised — skip rather than error
        };

          // Extract a 4-digit year dynamically
          const rawYear = getVal(["Year of Publication", "Year", "YearOfPublication", "Publication Year", "Published Year", "Yr", "YOP"]) 
                          ?? (() => {
                             const yearKey = Object.keys(r).find(k => k.toLowerCase().includes("year") && r[k] !== undefined);
                             return yearKey ? r[yearKey] : undefined;
                          })();
          let parsedYear: number | null = null;
          if (rawYear) {
            const m = String(rawYear).match(/\b(19|20)\d{2}\b/);
            parsedYear = m ? parseInt(m[0]) : parseInt(String(rawYear));
            if (isNaN(parsedYear)) parsedYear = null;
          }

          return ({
          // Excel columns: Acc No | CALL NO. | BOOK NO. | Date | Title | Author | Publication | PLACE OF PUBLICATION | Year of Publication | Edition | Source | Cost | ISBN
          accession_number: String(getVal(["Acc No", "AccessionNumber", "Accession Number", "accession_number"]) ?? "").trim(),
          call_no:           String(getVal(["CALL NO.", "CallNo", "call_no", "Call No", "CALL NO"]) ?? "").trim() || null,
          book_no:           String(getVal(["BOOK NO.", "BookNo", "book_no", "Book No", "BOOK NO"]) ?? "").trim() || null,
          acquisition_date:  parseDate(getVal(["Date", "acquisition_date", "AcquisitionDate"])),
          title:             String(getVal(["Title", "title"]) ?? "").trim(),
          author:            String(getVal(["Author", "author"]) ?? "").trim() || null,
          publisher:         String(getVal(["Publication", "Publisher", "publisher"]) ?? "").trim() || null,
          place_of_publication: String(getVal(["PLACE OF PUBLICATION", "PlaceOfPublication", "place_of_publication", "Place"]) ?? "").trim() || null,
          year_of_publication: parsedYear,
          edition:           String(getVal(["Edition", "edition"]) ?? "").trim() || null,
          source:            String(getVal(["Source", "source"]) ?? "").trim() || null,
          cost:              parseFloat(String(getVal(["Cost", "cost"]))) || null,
          isbn:              String(getVal(["ISBN", "isbn"]) ?? "").trim() || null,
          branch_id:         lockedBranchId ?? (effectiveBranchId ? parseInt(effectiveBranchId) : null),
          status:            "Available" as const,
        });
      }).filter((r: any) => r.accession_number && r.title);

      if (rows.length === 0) {
        toast.error("No valid rows found. Ensure AccessionNumber and Title columns exist.");
        return;
      }

      await bulkInsertBooks(rows);
      toast.success(`${rows.length} book${rows.length > 1 ? "s" : ""} imported!`);
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const BranchPicker = () => (
    <div>
      <Label>Branch / Campus</Label>
      {lockedBranchId ? (
        <p className="text-sm text-muted-foreground mt-1 px-3 py-2 bg-muted/30 rounded-md border border-border">
          {adminBranch?.branch_name}
        </p>
      ) : (
        <Select value={form.branch_id} onValueChange={v => upd("branch_id", v)}>
          <SelectTrigger>
            <SelectValue placeholder={branches.length === 0 ? "No branches" : "Select campus"} />
          </SelectTrigger>
          <SelectContent>
            {(branches as any[]).map((b: any) => (
              <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );

  return (
    <div className="animate-fade-in">
      <PageHeader title="Add Book" description="Add a single book or bulk-import from Excel" />
      <div className="max-w-3xl">
        <Tabs defaultValue="single">
          <TabsList className="mb-4">
            <TabsTrigger value="single"><PlusCircle className="w-3.5 h-3.5 mr-1.5" />Add Single</TabsTrigger>
            <TabsTrigger value="bulk"><Upload className="w-3.5 h-3.5 mr-1.5" />Bulk Upload</TabsTrigger>
          </TabsList>

          {/* ── Single Add ── */}
          <TabsContent value="single">
            <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Label>Accession Number *</Label>
                  <Input placeholder="e.g. GVP/LIB/2024/001" value={form.accession_number}
                    onChange={e => upd("accession_number", e.target.value)} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>Call Number</Label>
                  <Input placeholder="e.g. 005.13" value={form.call_no}
                    onChange={e => upd("call_no", e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>Book Title *</Label>
                  <Input placeholder="Full title of the book" value={form.title}
                    onChange={e => upd("title", e.target.value)} />
                </div>
                <div>
                  <Label>Author</Label>
                  <Input placeholder="Author name(s)" value={form.author}
                    onChange={e => upd("author", e.target.value)} />
                </div>
                <div>
                  <Label>ISBN</Label>
                  <Input placeholder="e.g. 978-0-061-96436-9" value={form.isbn}
                    onChange={e => upd("isbn", e.target.value)} />
                </div>
                <div>
                  <Label>Publisher</Label>
                  <Input placeholder="Publisher name" value={form.publisher}
                    onChange={e => upd("publisher", e.target.value)} />
                </div>
                <div>
                  <Label>Year of Publication</Label>
                  <Input type="number" placeholder="e.g. 2023" value={form.year_of_publication}
                    onChange={e => upd("year_of_publication", e.target.value)} />
                </div>
                <div>
                  <Label>Edition</Label>
                  <Input placeholder="e.g. 3rd Edition" value={form.edition}
                    onChange={e => upd("edition", e.target.value)} />
                </div>
                <div>
                  <Label>Cost (₹)</Label>
                  <Input type="number" placeholder="e.g. 450" value={form.cost}
                    onChange={e => upd("cost", e.target.value)} />
                </div>
                <div>
                  <Label>Place of Publication</Label>
                  <Input placeholder="e.g. New Delhi" value={form.place_of_publication}
                    onChange={e => upd("place_of_publication", e.target.value)} />
                </div>
                <div>
                  <Label>Source</Label>
                  <Select value={form.source} onValueChange={v => upd("source", v)}>
                    <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                    <SelectContent>
                      {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <BranchPicker />
                </div>
              </div>

              <Button onClick={handleSubmit} className="w-full" disabled={addMutation.isPending}>
                {addMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Adding...</>
                ) : "Add Book to Inventory"}
              </Button>
            </div>
          </TabsContent>

          {/* ── Bulk Upload ── */}
          <TabsContent value="bulk">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="bg-muted/40 border border-border rounded-lg p-4 text-sm space-y-2">
                  <p className="font-semibold">Excel Column Format (exact headers):</p>
                  <div className="overflow-x-auto">
                    <table className="text-xs text-muted-foreground border-collapse w-full">
                      <thead>
                        <tr className="border-b border-border">
                          {["Acc No","CALL NO.","BOOK NO.","Date","Title","Author","Publication","PLACE OF PUBLICATION","Year of Publication","Edition","Source","Cost","ISBN"]
                            .map(h => <th key={h} className="text-left px-2 py-1 font-mono whitespace-nowrap">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {["GVP/001","005.13","B001","2024-01-01","Book Title","Author Name","Publisher","New Delhi","2023","3rd","Purchase","450","978-..."]
                            .map((ex, i) => <td key={i} className="px-2 py-1 text-muted-foreground/60 whitespace-nowrap">{ex}</td>)}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All books will be assigned to{" "}
                    <span className="font-medium text-foreground">
                      {lockedBranchId ? adminBranch?.branch_name : "the selected branch (pick one below first)"}
                    </span>.
                  </p>
                </div>

                {/* Super-admin needs to pick branch before upload */}
                {isSuperAdmin && (
                  <div className="max-w-xs">
                    <BranchPicker />
                  </div>
                )}

                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={importing || (isSuperAdmin && !form.branch_id)}
                  onClick={() => fileRef.current?.click()}
                >
                  {importing
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
                    : <><Upload className="w-4 h-4" /> Choose Excel File</>
                  }
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleExcelUpload}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AddBook;
