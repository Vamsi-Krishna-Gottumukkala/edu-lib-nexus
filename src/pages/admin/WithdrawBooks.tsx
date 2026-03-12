import React, { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockBooks, withdrawReasons } from "@/lib/mockData";
import { toast } from "sonner";

const WithdrawBooks = () => {
  const [accessionNo, setAccessionNo] = useState("");
  const [reason, setReason] = useState("");
  const withdrawn = mockBooks.filter(b => b.status === "Withdrawn");

  const handleWithdraw = () => {
    if (!accessionNo || !reason) { toast.error("Fill all fields"); return; }
    const book = mockBooks.find(b => b.accessionNumber === accessionNo);
    if (!book) { toast.error("Book not found"); return; }
    toast.success(`Book ${accessionNo} withdrawn. Reason: ${reason}`);
    setAccessionNo(""); setReason("");
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Withdraw Books" description="Withdraw damaged or obsolete books from inventory" />
      <div className="max-w-2xl mb-6">
        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
          <div>
            <Label>Accession Number</Label>
            <Input placeholder="ACC1008" value={accessionNo} onChange={e => setAccessionNo(e.target.value)} />
          </div>
          <div>
            <Label>Reason for Withdrawal</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
              <SelectContent>
                {withdrawReasons.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="destructive" onClick={handleWithdraw}>Withdraw Book</Button>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-3">Withdrawn Books</h3>
      <div className="bg-card rounded-xl border border-border/50 card-shadow p-4">
        {withdrawn.map(b => (
          <div key={b.accessionNumber} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
            <div>
              <p className="text-sm font-medium">{b.title}</p>
              <p className="text-xs text-muted-foreground">{b.accessionNumber} • {b.branch}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WithdrawBooks;
