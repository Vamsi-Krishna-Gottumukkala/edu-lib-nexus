import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import { getAllRFIDMappings, getRFIDByUser, upsertRFID, removeRFID } from "@/lib/services/catalog";
import { getUserById } from "@/lib/services/users";
import { Search, Wifi, Trash2, Loader2, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function ManageRFID() {
  const qc = useQueryClient();
  const { adminBranch } = useAuth();
  const branchId = adminBranch?.branch_id ?? null;

  // Register tab state
  const [regUserId, setRegUserId]   = useState("");
  const [regUid, setRegUid]         = useState("");
  const [regUser, setRegUser]       = useState<any>(null);
  const [regLoading, setRegLoading] = useState(false);

  // Edit tab state
  const [editUserId, setEditUserId]     = useState("");
  const [foundRFID, setFoundRFID]       = useState<any>(null);
  const [foundUser, setFoundUser]       = useState<any>(null);
  const [newUid, setNewUid]             = useState("");
  const [saving, setSaving]             = useState(false);

  const { data: allMappings = [] } = useQuery({
    queryKey: ["rfid-mappings", branchId],
    queryFn: () => getAllRFIDMappings(branchId),
  });

  // Lookup user before registering
  async function handleLookup() {
    if (!regUserId.trim()) return;
    try {
      const u = await getUserById(regUserId.trim());
      setRegUser(u);
      const existing = await getRFIDByUser(regUserId.trim());
      if (existing) setRegUid(existing.uid);
      else setRegUid("");
    } catch { toast.error("User not found"); setRegUser(null); }
  }

  async function handleRegister() {
    if (!regUserId || !regUid) { toast.error("Enter both User ID and UID"); return; }
    setRegLoading(true);
    try {
      await upsertRFID(regUserId.trim(), regUid.trim());
      toast.success("RFID registered!");
      qc.invalidateQueries({ queryKey: ["rfid-mappings"] });
      setRegUser(null); setRegUserId(""); setRegUid("");
    } catch (e: any) { toast.error(e.message); }
    setRegLoading(false);
  }

  async function handleEditSearch() {
    if (!editUserId.trim()) return;
    try {
      const u = await getUserById(editUserId.trim());
      setFoundUser(u);
      const rfid = await getRFIDByUser(editUserId.trim());
      setFoundRFID(rfid);
      setNewUid(rfid?.uid ?? "");
    } catch { toast.error("User not found"); }
  }

  async function handleUpdateRFID() {
    setSaving(true);
    try {
      if (newUid.trim()) {
        await upsertRFID(foundUser.user_id, newUid.trim());
        toast.success("RFID updated!");
      } else {
        await removeRFID(foundUser.user_id);
        toast.success("RFID removed");
      }
      qc.invalidateQueries({ queryKey: ["rfid-mappings"] });
      setFoundUser(null); setFoundRFID(null); setEditUserId("");
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Manage RFID" description="Register and update RFID card assignments" />

      <Tabs defaultValue="register">
        <TabsList>
          <TabsTrigger value="register">Register Card</TabsTrigger>
          <TabsTrigger value="edit">Edit Assignment</TabsTrigger>
          <TabsTrigger value="all">All Mappings</TabsTrigger>
        </TabsList>

        {/* Register */}
        <TabsContent value="register">
          <Card><CardContent className="pt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Look up a user, then enter the UID from the RFID card (tap the card on the reader and copy the UID shown).
            </p>
            <div className="flex gap-2">
              <Input placeholder="Roll No / Faculty ID" value={regUserId} onChange={e => setRegUserId(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLookup()} />
              <Button variant="outline" onClick={handleLookup} className="shrink-0 gap-1.5"><Search className="w-4 h-4" /> Lookup</Button>
            </div>
            {regUser && (
              <div className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{regUser.user_name}</p>
                    <p className="text-xs text-muted-foreground">{regUser.user_id} · <Badge variant={regUser.user_type === "student" ? "default" : "secondary"} className="text-[10px] py-0">{regUser.user_type}</Badge></p>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">RFID Card UID</label>
                  <Input
                    placeholder="e.g. A3F2C109"
                    value={regUid}
                    onChange={e => setRegUid(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                </div>
                <Button onClick={handleRegister} disabled={!regUid || regLoading} className="gap-2">
                  {regLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                  {foundRFID ? "Update Card" : "Register Card"}
                </Button>
              </div>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* Edit */}
        <TabsContent value="edit">
          <Card><CardContent className="pt-6 space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Roll No / Faculty ID" value={editUserId} onChange={e => setEditUserId(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEditSearch()} />
              <Button variant="outline" onClick={handleEditSearch} className="shrink-0 gap-1.5"><Search className="w-4 h-4" /> Search</Button>
            </div>
            {foundUser && (
              <div className="border border-border rounded-lg p-4 space-y-3">
                <p className="font-medium">{foundUser.user_name} <span className="text-xs text-muted-foreground">({foundUser.user_id})</span></p>
                <p className="text-xs text-muted-foreground">Current UID: <span className="font-mono text-foreground">{foundRFID?.uid ?? "None"}</span></p>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">New UID (leave blank to remove)</label>
                  <Input value={newUid} onChange={e => setNewUid(e.target.value.toUpperCase())} className="font-mono" placeholder="New card UID" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUpdateRFID} disabled={saving} className="gap-1.5">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
                    Update
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive gap-1.5" onClick={() => { setNewUid(""); handleUpdateRFID(); }} disabled={!foundRFID}>
                    <Trash2 className="w-3.5 h-3.5" /> Remove Card
                  </Button>
                </div>
              </div>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* All Mappings */}
        <TabsContent value="all">
          <Card><CardContent className="pt-4">
            <DataTable
              columns={[
                { header: "UID", accessor: (r: any) => <span className="font-mono text-xs">{r.uid}</span> },
                { header: "User ID", accessor: "user_id" },
                { header: "Name", accessor: (r: any) => r.users?.user_name ?? "—" },
                {
                  header: "Type",
                  accessor: (r: any) => (
                    <Badge variant={r.users?.user_type === "student" ? "default" : "secondary"}>
                      {r.users?.user_type ?? "—"}
                    </Badge>
                  ),
                },
                { header: "Program", accessor: (r: any) => r.users?.programs?.branch_name ?? "—" },
              ]}
              data={allMappings}
            />
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
