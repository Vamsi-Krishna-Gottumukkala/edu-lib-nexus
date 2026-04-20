import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { RFIDProvider } from "@/contexts/RFIDContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import Login from "@/pages/Login";
import NotFound from "./pages/NotFound.tsx";

// Admin pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import RFIDLogs from "@/pages/admin/RFIDLogs";
import RegisteredUsers from "@/pages/admin/RegisteredUsers";
import DailyAttendance from "@/pages/admin/DailyAttendance";
import QPDashboard from "@/pages/admin/QPDashboard";
import UploadPaper from "@/pages/admin/UploadPaper";
import InventoryOverview from "@/pages/admin/InventoryOverview";
import AvailableBooks from "@/pages/admin/AvailableBooks";
import AddBook from "@/pages/admin/AddBook";
import IssueBook from "@/pages/admin/IssueBook";
import ReturnBook from "@/pages/admin/ReturnBook";
import TransferBook from "@/pages/admin/TransferBook";
import LostBooks from "@/pages/admin/LostBooks";
import WithdrawBooks from "@/pages/admin/WithdrawBooks";
import BranchOverview from "@/pages/admin/BranchOverview";
import ReportIssued from "@/pages/admin/ReportIssued";
import ReturnedBooks from "@/pages/admin/ReturnedBooks";
import Guide from "@/pages/admin/Guide";
import Announcements from "@/pages/admin/Announcements";
import AttendanceReport from "@/pages/admin/AttendanceReport";
import ManageStudents from "@/pages/admin/ManageStudents";
import ManageFaculty from "@/pages/admin/ManageFaculty";
import ManageRFID from "@/pages/admin/ManageRFID";
import ManagePrograms from "@/pages/admin/ManagePrograms";
import ManageDepartments from "@/pages/admin/ManageDepartments";

// Student pages
import StudentDashboard from "@/pages/student/StudentDashboard";

// Generic pages
import {
  VisitHistory, ManagePapers, DownloadAnalytics, SubjectPopularity,
  AddBranch, ManageBranches, ReportLost, ReportWithdrawn, ReportGate,
  ReportVisits, UserManagement, SystemSettings,
  StudentIssuedBooks, StudentDueBooks, BrowseBooks, BranchAvailability,
  BrowsePapers, DownloadPapers, MyVisits, AttendanceHistory, StudentProfile,
} from "@/pages/GenericPages";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min cache
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RFIDProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Protected — Admin */}
              <Route
                element={
                  <ProtectedRoute requiredRole="admin">
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/rfid-logs" element={<RFIDLogs />} />
                <Route path="/admin/registered-users" element={<RegisteredUsers />} />
                <Route path="/admin/daily-attendance" element={<DailyAttendance />} />
                <Route path="/admin/visit-history" element={<VisitHistory />} />
                <Route path="/admin/qp-dashboard" element={<QPDashboard />} />
                <Route path="/admin/upload-paper" element={<UploadPaper />} />
                <Route path="/admin/manage-papers" element={<ManagePapers />} />
                <Route path="/admin/download-analytics" element={<DownloadAnalytics />} />
                <Route path="/admin/subject-popularity" element={<SubjectPopularity />} />
                <Route path="/admin/inventory" element={<InventoryOverview />} />
                <Route path="/admin/available-books" element={<AvailableBooks />} />
                <Route path="/admin/add-book" element={<AddBook />} />
                <Route path="/admin/issue-book" element={<IssueBook />} />
                <Route path="/admin/return-book" element={<ReturnBook />} />
                <Route path="/admin/transfer-book" element={<TransferBook />} />
                <Route path="/admin/lost-books" element={<LostBooks />} />
                <Route path="/admin/withdraw-books" element={<WithdrawBooks />} />
                <Route path="/admin/returned-books" element={<ReturnedBooks />} />
                <Route path="/admin/guide" element={<Guide />} />
                <Route path="/admin/announcements" element={<Announcements />} />
                <Route path="/admin/branches" element={<BranchOverview />} />
                <Route path="/admin/add-branch" element={<AddBranch />} />
                <Route path="/admin/manage-branches" element={<ManageBranches />} />
                <Route path="/admin/report-issued" element={<ReportIssued />} />
                <Route path="/admin/report-lost" element={<ReportLost />} />
                <Route path="/admin/report-withdrawn" element={<ReportWithdrawn />} />
                <Route path="/admin/report-gate" element={<ReportGate />} />
                <Route path="/admin/report-visits" element={<ReportVisits />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/settings" element={<SystemSettings />} />
                <Route path="/admin/attendance-report" element={<AttendanceReport />} />
                <Route path="/admin/manage-students" element={<ManageStudents />} />
                <Route path="/admin/manage-faculty" element={<ManageFaculty />} />
                <Route path="/admin/manage-rfid" element={<ManageRFID />} />
                <Route path="/admin/manage-programs" element={<ManagePrograms />} />
                <Route path="/admin/manage-departments" element={<ManageDepartments />} />
              </Route>

              {/* Protected — Student */}
              <Route
                element={
                  <ProtectedRoute requiredRole="student">
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/student/issued-books" element={<StudentIssuedBooks />} />
                <Route path="/student/due-books" element={<StudentDueBooks />} />
                <Route path="/student/browse-books" element={<BrowseBooks />} />
                <Route path="/student/branch-availability" element={<BranchAvailability />} />
                <Route path="/student/browse-papers" element={<BrowsePapers />} />
                <Route path="/student/download-papers" element={<DownloadPapers />} />
                <Route path="/student/my-visits" element={<MyVisits />} />
                <Route path="/student/attendance-history" element={<AttendanceHistory />} />
                <Route path="/student/profile" element={<StudentProfile />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </RFIDProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
