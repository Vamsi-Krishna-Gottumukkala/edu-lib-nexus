import React, { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAnnouncements, addAnnouncement, deleteAnnouncement, toggleAnnouncement } from "@/lib/services/announcements";

const Announcements = () => {
  const queryClient = useQueryClient();
  const [newText, setNewText] = useState("");

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => getAnnouncements(),
  });

  const addMutation = useMutation({
    mutationFn: () => addAnnouncement(newText.trim()),
    onSuccess: () => {
      setNewText("");
      toast.success("Announcement added");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: () => toast.error("Failed to add announcement"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAnnouncement(id),
    onSuccess: () => {
      toast.success("Announcement deleted");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleAnnouncement(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  const activeOnes = announcements.filter((a: any) => a.is_active);

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader title="Announcements" description="Manage the scrolling announcement ticker visible to all users" />

      <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow mb-6">
        <h3 className="text-sm font-semibold text-card-foreground mb-3">Add New Announcement</h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Enter announcement text..."
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && newText.trim() && addMutation.mutate()}
            />
          </div>
          <Button onClick={() => addMutation.mutate()} disabled={!newText.trim() || addMutation.isPending}>
            {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" />Add</>}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl p-5 border border-border/50 card-shadow">
        <h3 className="text-sm font-semibold text-card-foreground mb-3">
          All Announcements ({announcements.length})
        </h3>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No announcements. Add one above.</p>
        ) : (
          <div className="space-y-2">
            {announcements.map((ann: any) => (
              <div key={ann.id} className={`flex items-center gap-3 p-3 rounded-lg border ${ann.is_active ? "bg-muted/50 border-border/30" : "bg-muted/20 border-border/10 opacity-60"}`}>
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${ann.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {ann.id}
                </span>
                <p className="text-sm text-card-foreground flex-1">{ann.text}</p>
                <button
                  onClick={() => toggleMutation.mutate({ id: ann.id, isActive: !ann.is_active })}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title={ann.is_active ? "Deactivate" : "Activate"}
                >
                  {ann.is_active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <Button
                  variant="ghost" size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate(ann.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeOnes.length > 0 && (
        <div className="mt-6 bg-primary/5 rounded-xl p-5 border border-primary/20">
          <h3 className="text-sm font-semibold text-card-foreground mb-2">Live Preview</h3>
          <div className="overflow-hidden rounded-lg bg-card border border-border">
            <div className="py-2 px-4 whitespace-nowrap animate-marquee">
              {activeOnes.map((ann: any) => (
                <span key={ann.id} className="inline-block mr-16 text-sm text-foreground">{ann.text}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
