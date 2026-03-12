import React, { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { mockBooks } from "@/lib/mockData";
import { toast } from "sonner";

const ReturnBook = () => {
  const [accessionNo, setAccessionNo] = useState("");
  const [foundBook, setFoundBook] = useState<typeof mockBooks[0] | null>(null);
  const [returnDate] = useState(new Date().toISOString().split("T")[0]);

  const lookupBook = () => {
    const b = mockBooks.find(b => b.accessionNumber === accessionNo && b.status === "Issued");
    setFoundBook(b || null);
    if (!b) toast.error("No issued book found with this accession number");
  };

  const calculateFine = () => {
    if (!foundBook?.dueDate) return 0;
    const due = new Date(foundBook.dueDate);
    const today = new Date();
    const diff = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff * 5 : 0; // ₹5 per day
  };

  const handleReturn = () => {
    if (!foundBook) return;
    const fine = calculateFine();
    toast.success(`Book ${accessionNo} returned successfully${fine > 0 ? `. Fine: ₹${fine}` : ""}`);
    setAccessionNo(""); setFoundBook(null);
  };

  const fine = foundBook ? calculateFine() : 0;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Return Book" description="Process book return and calculate fines" />
      <div className="max-w-2xl space-y-6">
        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
          <h3 className="text-sm font-semibold text-card-foreground">Enter Accession Number</h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input placeholder="e.g. ACC1002" value={accessionNo} onChange={e => setAccessionNo(e.target.value)} />
            </div>
            <Button onClick={lookupBook}>Lookup</Button>
          </div>
        </div>

        {foundBook && (
          <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
            <h3 className="text-sm font-semibold text-card-foreground">Issue Record</h3>
            <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
              <p><span className="font-medium">Title:</span> {foundBook.title}</p>
              <p><span className="font-medium">Issued To:</span> {foundBook.issuedTo}</p>
              <p><span className="font-medium">Issue Date:</span> {foundBook.issueDate}</p>
              <p><span className="font-medium">Due Date:</span> {foundBook.dueDate}</p>
              <p><span className="font-medium">Return Date:</span> {returnDate}</p>
              {fine > 0 && (
                <p className="text-destructive font-semibold">Overdue Fine: ₹{fine}</p>
              )}
            </div>
            <Button onClick={handleReturn} className="w-full">Process Return</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnBook;
