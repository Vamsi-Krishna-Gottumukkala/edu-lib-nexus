import React, { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockBooks, mockBranches } from "@/lib/mockData";
import { toast } from "sonner";

const TransferBook = () => {
  const [accessionNo, setAccessionNo] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [foundBook, setFoundBook] = useState<typeof mockBooks[0] | null>(null);

  const lookupBook = () => {
    const b = mockBooks.find(b => b.accessionNumber === accessionNo && b.status === "Available");
    setFoundBook(b || null);
    if (!b) toast.error("No available book found with this accession number");
  };

  const handleTransfer = () => {
    if (!foundBook || !toBranch) { toast.error("Please fill all fields"); return; }
    if (foundBook.branch === toBranch) { toast.error("Cannot transfer to the same branch"); return; }
    toast.success(`Book ${accessionNo} transferred from ${foundBook.branch} to ${toBranch}`);
    setAccessionNo(""); setFoundBook(null); setToBranch("");
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Transfer Book" description="Transfer book between library branches" />
      <div className="max-w-2xl space-y-6">
        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Accession Number</Label>
              <Input placeholder="e.g. ACC1001" value={accessionNo} onChange={e => setAccessionNo(e.target.value)} />
            </div>
            <Button onClick={lookupBook} className="mt-6">Lookup</Button>
          </div>
          {foundBook && (
            <>
              <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                <p><span className="font-medium">Title:</span> {foundBook.title}</p>
                <p><span className="font-medium">Current Branch:</span> {foundBook.branch}</p>
              </div>
              <div>
                <Label>Transfer To Branch</Label>
                <Select value={toBranch} onValueChange={setToBranch}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {mockBranches.filter(b => b.name !== foundBook.branch).map(b => (
                      <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleTransfer} className="w-full">Transfer Book</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransferBook;
