import React, { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, Bell, Search, X, Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { adminNav, studentNav } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getAnnouncements } from "@/lib/services/announcements";

export const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const { role, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  // Branch admins cannot see or access Branch Control — filter it out
  const rawNav = role === "admin" ? adminNav : studentNav;
  const navItems = (role === "admin" && !isSuperAdmin)
    ? rawNav.filter(item => item.title !== "Branches")
    : rawNav;
  const searchRef = useRef<HTMLDivElement>(null);

  // Load real announcements from Supabase (active only)
  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements-ticker"],
    queryFn: () => getAnnouncements(true),
    staleTime: 1000 * 60 * 5, // 5 min
  });

  // Simple nav-based search (no mock data)
  function getNavResults(query: string) {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    const results: { type: string; title: string; subtitle: string; url: string }[] = [];
    function flattenNav(items: typeof navItems) {
      items.forEach((item: any) => {
        if (item.url && item.title.toLowerCase().includes(q)) {
          results.push({ type: "page", title: item.title, subtitle: "Page", url: item.url });
        }
        if (item.children) flattenNav(item.children);
      });
    }
    flattenNav(navItems);
    return results.slice(0, 8);
  }

  const results = getNavResults(searchQuery);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar items={navItems} collapsed={collapsed} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8"
            >
              <Menu className="h-4 w-4" />
            </Button>
            {/* Nav Search */}
            <div ref={searchRef} className="hidden sm:block relative">
              <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  placeholder="Search pages..."
                  className="bg-transparent border-none outline-none text-sm w-48 placeholder:text-muted-foreground"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowResults(true); }}
                  onFocus={() => setShowResults(true)}
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); setShowResults(false); }}>
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              {showResults && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-card border border-border rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
                  {results.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">No pages found</div>
                  ) : (
                    results.map((r, i) => (
                      <button
                        key={i}
                        className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors flex items-center gap-3 border-b border-border/50 last:border-0"
                        onClick={() => { navigate(r.url); setSearchQuery(""); setShowResults(false); }}
                      >
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {r.type}
                        </span>
                        <p className="text-sm font-medium text-card-foreground truncate">{r.title}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <Bell className="h-4 w-4" />
              {announcements.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              )}
            </Button>
          </div>
        </header>

        {/* Announcement Ticker */}
        {announcements.length > 0 && (
          <div className="bg-primary/5 border-b border-border overflow-hidden shrink-0">
            <div className="py-1.5 whitespace-nowrap animate-marquee">
              {announcements.map((ann: any) => (
                <span key={ann.id} className="inline-block mr-16 text-xs text-foreground font-medium">
                  {ann.text}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
