import React, { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, Bell, Search, Building2, X } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { adminNav, studentNav } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockBooks, mockStudents, mockQuestionPapers, mockBranches } from "@/lib/mockData";

interface SearchResult {
  type: "book" | "student" | "paper" | "branch" | "page";
  title: string;
  subtitle: string;
  url: string;
}

function getSearchResults(query: string, role: string): SearchResult[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  // Books
  mockBooks.forEach(b => {
    if (b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.accessionNumber.toLowerCase().includes(q)) {
      results.push({ type: "book", title: b.title, subtitle: `${b.accessionNumber} • ${b.status}`, url: role === "admin" ? "/admin/inventory" : "/student/browse-books" });
    }
  });

  // Students (admin only)
  if (role === "admin") {
    mockStudents.forEach(s => {
      if (s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)) {
        results.push({ type: "student", title: s.name, subtitle: `${s.id} • ${s.department}`, url: "/admin/registered-users" });
      }
    });
  }

  // Papers
  mockQuestionPapers.forEach(p => {
    if (p.subjectName.toLowerCase().includes(q) || p.subjectCode.toLowerCase().includes(q)) {
      results.push({ type: "paper", title: p.subjectName, subtitle: `${p.subjectCode} • ${p.department}`, url: role === "admin" ? "/admin/qp-dashboard" : "/student/browse-papers" });
    }
  });

  // Branches
  mockBranches.forEach(b => {
    if (b.name.toLowerCase().includes(q)) {
      results.push({ type: "branch", title: b.name, subtitle: b.location, url: role === "admin" ? "/admin/branches" : "/student/branch-availability" });
    }
  });

  // Nav pages
  const navItems = role === "admin" ? adminNav : studentNav;
  function flattenNav(items: typeof navItems, results: SearchResult[]) {
    items.forEach(item => {
      if (item.url && item.title.toLowerCase().includes(q)) {
        results.push({ type: "page", title: item.title, subtitle: "Page", url: item.url });
      }
      if (item.children) flattenNav(item.children, results);
    });
  }
  flattenNav(navItems, results);

  return results.slice(0, 8);
}

export const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const { role } = useAuth();
  const navigate = useNavigate();
  const navItems = role === "admin" ? adminNav : studentNav;
  const searchRef = useRef<HTMLDivElement>(null);

  const results = getSearchResults(searchQuery, role);

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
            {/* Live Search */}
            <div ref={searchRef} className="hidden sm:block relative">
              <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  placeholder="Search books, students, papers..."
                  className="bg-transparent border-none outline-none text-sm w-56 placeholder:text-muted-foreground"
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
                <div className="absolute top-full left-0 mt-1 w-80 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                  {results.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">No results found</div>
                  ) : (
                    results.map((r, i) => (
                      <button
                        key={i}
                        className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors flex items-center gap-3 border-b border-border/50 last:border-0"
                        onClick={() => { navigate(r.url); setSearchQuery(""); setShowResults(false); }}
                      >
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{r.type}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-card-foreground truncate">{r.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Branch Selector */}
            <div className="hidden md:flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-44 h-8 text-xs">
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {mockBranches.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </Button>
          </div>
        </header>
        {/* Announcement Ticker - admin only */}
        {role === "admin" && (
          <div className="bg-primary/5 border-b border-border overflow-hidden shrink-0">
            <div className="py-1.5 whitespace-nowrap animate-marquee">
              {announcements.map((text, i) => (
                <span key={i} className="inline-block mr-16 text-xs text-foreground font-medium">{text}</span>
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
