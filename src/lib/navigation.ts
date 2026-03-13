import {
  BookOpen, LayoutDashboard, DoorOpen, FileText, Library, GitBranch,
  BarChart3, Settings, LogOut, Users, Clock, History, Upload, TrendingUp,
  Download, Star, Search, BookCopy, ArrowLeftRight, AlertTriangle,
  XCircle, Building2, Plus, List, Bookmark, Eye, User, CalendarDays,
  type LucideIcon
} from "lucide-react";

export interface NavItem {
  title: string;
  url?: string;
  icon?: LucideIcon;
  children?: NavItem[];
}

export const adminNav: NavItem[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  {
    title: "Gate Register", icon: DoorOpen, children: [
      { title: "RFID System", icon: DoorOpen, children: [
        { title: "RFID Logs", url: "/admin/rfid-logs", icon: List },
        { title: "Registered Users", url: "/admin/registered-users", icon: Users },
      ]},
      { title: "Attendance", icon: Clock, children: [
        { title: "Daily Attendance", url: "/admin/daily-attendance", icon: CalendarDays },
        { title: "Student Visit History", url: "/admin/visit-history", icon: History },
      ]},
    ],
  },
  {
    title: "Question Papers", icon: FileText, children: [
      { title: "Repository", icon: FileText, children: [
        { title: "Question Paper Dashboard", url: "/admin/qp-dashboard", icon: LayoutDashboard },
        { title: "Upload Paper", url: "/admin/upload-paper", icon: Upload },
        { title: "Manage Papers", url: "/admin/manage-papers", icon: Settings },
      ]},
      { title: "Insights", icon: TrendingUp, children: [
        { title: "Download Analytics", url: "/admin/download-analytics", icon: Download },
        { title: "Subject Popularity", url: "/admin/subject-popularity", icon: Star },
      ]},
    ],
  },
  {
    title: "Books Inventory", icon: Library, children: [
      { title: "Books", icon: BookOpen, children: [
        { title: "Inventory Overview", url: "/admin/inventory", icon: Eye },
        { title: "Available Books", url: "/admin/available-books", icon: BookCopy },
        { title: "Add Book", url: "/admin/add-book", icon: Plus },
      ]},
      { title: "Circulation", icon: ArrowLeftRight, children: [
        { title: "Issue Book", url: "/admin/issue-book", icon: BookOpen },
        { title: "Return Book", url: "/admin/return-book", icon: BookCopy },
        { title: "Transfer Book", url: "/admin/transfer-book", icon: ArrowLeftRight },
      ]},
      { title: "Book Status", icon: AlertTriangle, children: [
        { title: "Lost Books", url: "/admin/lost-books", icon: AlertTriangle },
        { title: "Withdraw Books", url: "/admin/withdraw-books", icon: XCircle },
      ]},
    ],
  },
  {
    title: "Branches", icon: GitBranch, children: [
      { title: "Branch Control", icon: Building2, children: [
        { title: "Branch Overview", url: "/admin/branches", icon: Eye },
        { title: "Add Branch", url: "/admin/add-branch", icon: Plus },
        { title: "Manage Branches", url: "/admin/manage-branches", icon: Settings },
      ]},
    ],
  },
  {
    title: "Reports", icon: BarChart3, children: [
      { title: "Library Reports", icon: BarChart3, children: [
        { title: "Issued Books", url: "/admin/report-issued", icon: BookOpen },
        { title: "Lost Books", url: "/admin/report-lost", icon: AlertTriangle },
        { title: "Withdraw Books", url: "/admin/report-withdrawn", icon: XCircle },
      ]},
      { title: "Attendance Reports", icon: Clock, children: [
        { title: "Gate Register", url: "/admin/report-gate", icon: DoorOpen },
        { title: "Library Visits", url: "/admin/report-visits", icon: History },
      ]},
    ],
  },
  {
    title: "System", icon: Settings, children: [
      { title: "Administration", icon: Settings, children: [
        { title: "User Management", url: "/admin/users", icon: Users },
        { title: "Settings", url: "/admin/settings", icon: Settings },
      ]},
    ],
  },
  { title: "Guide", url: "/admin/guide", icon: BookOpen },
];

export const studentNav: NavItem[] = [
  { title: "Dashboard", url: "/student", icon: LayoutDashboard },
  {
    title: "My Library", icon: Library, children: [
      { title: "Library Status", icon: Library, children: [
        { title: "Issued Books", url: "/student/issued-books", icon: BookOpen },
        { title: "Due Books", url: "/student/due-books", icon: Clock },
      ]},
    ],
  },
  {
    title: "Search Books", icon: Search, children: [
      { title: "Browse Books", url: "/student/browse-books", icon: BookCopy },
      { title: "Branch Availability", url: "/student/branch-availability", icon: Building2 },
    ],
  },
  {
    title: "Question Bank", icon: FileText, children: [
      { title: "Browse Papers", url: "/student/browse-papers", icon: Search },
      { title: "Download Papers", url: "/student/download-papers", icon: Download },
    ],
  },
  {
    title: "Library Attendance", icon: Clock, children: [
      { title: "My Visits", url: "/student/my-visits", icon: CalendarDays },
      { title: "Attendance History", url: "/student/attendance-history", icon: History },
    ],
  },
  { title: "Profile", url: "/student/profile", icon: User },
];
