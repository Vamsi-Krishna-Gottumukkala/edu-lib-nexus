import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, BookOpen, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavItem } from "@/lib/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface AppSidebarProps {
  items: NavItem[];
  collapsed: boolean;
}

const NavItemComponent = ({ item, depth = 0, collapsed }: { item: NavItem; depth?: number; collapsed: boolean }) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;

  const isActiveUrl = item.url && location.pathname === item.url;
  const isChildActive = hasChildren && checkChildActive(item.children!, location.pathname);

  React.useEffect(() => {
    if (isChildActive) setOpen(true);
  }, [isChildActive]);

  if (collapsed && depth === 0) {
    return (
      <div className="relative group">
        {item.url ? (
          <Link
            to={item.url}
            className={cn(
              "flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-colors",
              isActiveUrl ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"
            )}
            title={item.title}
          >
            {item.icon && <item.icon className="h-5 w-5" />}
          </Link>
        ) : (
          <button
            className={cn(
              "flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-colors",
              isChildActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"
            )}
            title={item.title}
          >
            {item.icon && <item.icon className="h-5 w-5" />}
          </button>
        )}
      </div>
    );
  }

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
            isChildActive ? "text-primary font-medium bg-sidebar-accent" : "text-sidebar-foreground hover:bg-sidebar-accent",
            depth > 0 && "text-[13px]"
          )}
          style={{ paddingLeft: `${12 + depth * 12}px` }}
        >
          {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
          <span className="flex-1 text-left truncate">{item.title}</span>
          {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
        </button>
        {open && (
          <div className="mt-0.5">
            {item.children!.map((child) => (
              <NavItemComponent key={child.title} item={child} depth={depth + 1} collapsed={collapsed} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.url || "#"}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
        isActiveUrl
          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        depth > 0 && "text-[13px]"
      )}
      style={{ paddingLeft: `${12 + depth * 12}px` }}
    >
      {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
      <span className="truncate">{item.title}</span>
    </Link>
  );
};

function checkChildActive(items: NavItem[], pathname: string): boolean {
  return items.some((item) => {
    if (item.url === pathname) return true;
    if (item.children) return checkChildActive(item.children, pathname);
    return false;
  });
}

export const AppSidebar = ({ items, collapsed }: AppSidebarProps) => {
  const { role, userName, userId, signOut } = useAuth();

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar flex flex-col border-r border-sidebar-border transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
          <BookOpen className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-sm font-bold text-foreground">EduLibrary</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {role === "admin" ? "Admin Portal" : "Student Portal"}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-hide">
        {items.map((item) => (
          <NavItemComponent key={item.title} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* User & Sign Out */}
      <div className="border-t border-sidebar-border p-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-sidebar-primary">
              {userName ? userName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
            </span>
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{userName}</p>
                <p className="text-[10px] text-sidebar-foreground/60 capitalize">{role}</p>
              </div>
              <button
                onClick={signOut}
                title="Sign Out"
                className="w-7 h-7 flex items-center justify-center rounded-md text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {collapsed && (
            <button
              onClick={signOut}
              title="Sign Out"
              className="w-7 h-7 flex items-center justify-center rounded-md text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
