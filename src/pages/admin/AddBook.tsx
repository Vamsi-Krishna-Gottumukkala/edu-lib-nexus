import React, { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bookCategories, mockBranches } from "@/lib/mockData";
import { toast } from "sonner";

const AddBook = () => {
  const [form, setForm] = useState({
    title: "", author: "", isbn: "", category: "", branch: "", copies: "1",
  });

  const handleSubmit = () => {
    if (!form.title || !form.author || !form.isbn || !form.category || !form.branch) {
      toast.error("Please fill all required fields");
      return;
    }
    toast.success(`"${form.title}" added with ${form.copies} copies`);
    setForm({ title: "", author: "", isbn: "", category: "", branch: "", copies: "1" });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Add Book" description="Add new book copies to the inventory" />
      <div className="max-w-2xl">
        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Book Title *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Author *</Label>
              <Input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} />
            </div>
            <div>
              <Label>ISBN *</Label>
              <Input value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} />
            </div>
            <div>
              <Label>Number of Copies</Label>
              <Input type="number" min="1" value={form.copies} onChange={e => setForm({ ...form, copies: e.target.value })} />
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{bookCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Branch *</Label>
              <Select value={form.branch} onValueChange={v => setForm({ ...form, branch: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{mockBranches.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full">Add Book to Inventory</Button>
        </div>
      </div>
    </div>
  );
};

export default AddBook;
