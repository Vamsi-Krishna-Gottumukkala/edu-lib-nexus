import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addEbook, deleteEbook, getEbooks, isValidEbookUrl } from "@/lib/services/ebooks";
import { toast } from "sonner";

export default function ManageEbooks() {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [bookName, setBookName] = useState("");
  const [url, setUrl] = useState("");

  const { data: ebooks = [], isLoading } = useQuery({
    queryKey: ["ebooks"],
    queryFn: getEbooks,
  });

  const addMutation = useMutation({
    mutationFn: () => addEbook({
      subject_name: subject.trim(),
      book_name: bookName.trim(),
      url: url.trim(),
    }),
    onSuccess: () => {
      toast.success("E-book added");
      setSubject("");
      setBookName("");
      setUrl("");
      queryClient.invalidateQueries({ queryKey: ["ebooks"] });
    },
    onError: (error: any) => toast.error(error.message || "Could not add e-book"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEbook,
    onSuccess: () => {
      toast.success("E-book removed");
      queryClient.invalidateQueries({ queryKey: ["ebooks"] });
    },
    onError: (error: any) => toast.error(error.message || "Could not remove e-book"),
  });

  function handleAdd() {
    if (!subject.trim() || !bookName.trim() || !url.trim()) {
      toast.error("Subject, book name, and URL are required.");
      return;
    }
    if (!isValidEbookUrl(url.trim())) {
      toast.error("Enter a valid http:// or https:// URL.");
      return;
    }
    addMutation.mutate();
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="E-Books" description="Add and manage e-book links for students" />

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_2fr_auto] xl:items-end">
            <div>
              <Label htmlFor="ebook-subject">Subject</Label>
              <Input id="ebook-subject" className="mt-1" placeholder="e.g. Data Structures" value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ebook-name">Book name</Label>
              <Input id="ebook-name" className="mt-1" placeholder="e.g. Introduction to Algorithms" value={bookName} onChange={e => setBookName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ebook-url">E-book URL</Label>
              <Input id="ebook-url" className="mt-1" placeholder="https://example.com/book" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} />
            </div>
            <Button onClick={handleAdd} disabled={addMutation.isPending} className="gap-2">
              {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add E-Book
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <DataTable
          columns={[
            { header: "Subject", accessor: "subject_name" },
            { header: "Book name", accessor: "book_name" },
            {
              header: "Link",
              accessor: (row: any) => isValidEbookUrl(row.url) ? (
                <a href={row.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                  Open link <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : "Invalid URL",
            },
            {
              header: "Action",
              accessor: (row: any) => (
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(row.id)} disabled={deleteMutation.isPending}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              ),
            },
          ]}
          data={ebooks}
          emptyMessage="No e-books added yet"
        />
      )}
    </div>
  );
}
