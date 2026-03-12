import React, { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { mockBooks, mockStudents } from "@/lib/mockData";

const LostBooks = () => {
  const [accessionNo, setAccessionNo] = useState("");
  const [studentId, setStudentId] = useState("");
  const lostBooks = mockBooks.filter(b => b.status === "Lost");

  const handleMarkLost = () => {
    if (!accessionNo || !studentId) { toast.error("Fill all fields"); return; }
    const book = mockBooks.find(b => b.accessionNumber === accessionNo);
    const student = mockStudents.find(s => s.id === studentId);
    if (!book) { toast.error("Book not found"); return; }
    if (!student) { toast.error("Student not found"); return; }
    toast.success(`Book ${accessionNo} marked as Lost. Responsible: ${student.name}`);
    setAccessionNo(""); setStudentId("");
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Lost Books" description="Mark and track lost book copies" />
      <div className="max-w-2xl mb-6">
        <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow space-y-4">
          <h3 className="text-sm font-semibold text-card-foreground">Mark Book as Lost</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Accession Number</Label>
              <Input placeholder="ACC1005" value={accessionNo} onChange={e => setAccessionNo(e.target.value)} />
            </div>
            <div>
              <Label>Responsible Student ID</Label>
              <Input placeholder="STU2024001" value={studentId} onChange={e => setStudentId(e.target.value)} />
            </div>
          </div>
          <Button variant="destructive" onClick={handleMarkLost}>Mark as Lost</Button>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-3">Lost Books Records</h3>
      <div className="bg-card rounded-xl border border-border/50 card-shadow p-4">
        {lostBooks.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">No lost books recorded</p>
        ) : (
          <div className="space-y-2">
            {lostBooks.map(b => (
              <div key={b.accessionNumber} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-sm font-medium">{b.title}</p>
                  <p className="text-xs text-muted-foreground">{b.accessionNumber} • {b.branch}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LostBooks;
