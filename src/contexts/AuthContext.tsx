import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

export type UserRole = "admin" | "student" | "faculty";

const SUPER_ADMIN_EMAIL = "gvpcentrallibrary@gvpcdpgc.edu.in";

export interface StudentSession {
  user_id: string;
  user_name: string;
  user_type: string;
  program_id: number | null;
  year: number | null;
  department_id: number | null;
  branch_id: number | null;
}

export interface FacultySession {
  user_id: string;
  user_name: string;
  user_type: string;
  department_id: number | null;
  designation: string | null;
  branch_id: number | null;
}

export interface AdminBranchInfo {
  branch_id: number;
  branch_name: string;
  admin_email: string;
}

interface AuthContextType {
  role: UserRole | null;
  userName: string;
  userId: string;
  studentData: StudentSession | null;
  facultyData: FacultySession | null;
  loading: boolean;
  isSuperAdmin: boolean;
  adminBranch: AdminBranchInfo | null;
  signInAdmin: (email: string, password: string) => Promise<void>;
  signInStudent: (rollNo: string) => Promise<void>;
  signInFaculty: (facultyNo: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const STUDENT_SESSION_KEY = "lib_student_session";
const FACULTY_SESSION_KEY = "lib_faculty_session";

const AuthContext = createContext<AuthContextType>({
  role: null,
  userName: "",
  userId: "",
  studentData: null,
  facultyData: null,
  loading: true,
  isSuperAdmin: false,
  adminBranch: null,
  signInAdmin: async () => {},
  signInStudent: async () => {},
  signInFaculty: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

/** Resolve which campus branch an admin belongs to. Never throws. */
async function resolveBranch(email: string): Promise<AdminBranchInfo | null> {
  try {
    const { data, error } = await supabase
      .from("library_branches")
      .select("id, name, admin_email")
      .eq("admin_email", email)
      .maybeSingle();
    if (error || !data) return null;
    return {
      branch_id: data.id,
      branch_name: data.name,
      admin_email: data.admin_email,
    };
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [studentData, setStudentData] = useState<StudentSession | null>(null);
  const [facultyData, setFacultyData] = useState<FacultySession | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminBranch, setAdminBranch] = useState<AdminBranchInfo | null>(null);
  const [loading, setLoading] = useState(true);

  /** Set all admin state from a Supabase user object. Never throws. */
  async function applyAdminSession(user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  }) {
    const email = user.email ?? "";
    const name =
      (user.user_metadata?.full_name as string | undefined) || email || "Admin";
    const isSuper = email === SUPER_ADMIN_EMAIL;
    const branch = isSuper ? null : await resolveBranch(email);

    setRole("admin");
    setUserName(name);
    setUserId(user.id);
    setIsSuperAdmin(isSuper);
    setAdminBranch(branch);
  }

  useEffect(() => {
    // Restore existing session on page load
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          await applyAdminSession(session.user);
          setLoading(false);
          return;
        }

        const stored = localStorage.getItem(STUDENT_SESSION_KEY);
        if (stored) {
          try {
            const student: StudentSession = JSON.parse(stored);
            setRole("student");
            setUserName(student.user_name);
            setUserId(student.user_id);
            setStudentData(student);
          } catch {
            localStorage.removeItem(STUDENT_SESSION_KEY);
          }
        }

        const storedFaculty = localStorage.getItem(FACULTY_SESSION_KEY);
        if (storedFaculty) {
          try {
            const faculty: FacultySession = JSON.parse(storedFaculty);
            setRole("faculty");
            setUserName(faculty.user_name);
            setUserId(faculty.user_id);
            setFacultyData(faculty);
          } catch {
            localStorage.removeItem(FACULTY_SESSION_KEY);
          }
        }
      } catch {
        // ignore — setLoading(false) in finally handles this
      } finally {
        setLoading(false);
      }
    })();

    // Listen for auth changes (token refresh, sign-out from another tab, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        if (!localStorage.getItem(STUDENT_SESSION_KEY) && !localStorage.getItem(FACULTY_SESSION_KEY)) {
          setRole(null);
          setUserName("");
          setUserId("");
          setIsSuperAdmin(false);
          setAdminBranch(null);
        }
      }
      // Note: sign-in is handled directly in signInAdmin to avoid double-call
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInAdmin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    await applyAdminSession(data.user);
  };

  const signInStudent = async (rollNo: string) => {
    const { data, error } = await supabase.rpc("authenticate_student", {
      p_roll_no: rollNo,
    });
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error("Invalid roll number. Student not found.");
    }
    const student: StudentSession = data[0];
    localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(student));
    setRole("student");
    setUserName(student.user_name);
    setUserId(student.user_id);
    setStudentData(student);
  };

  const signInFaculty = async (facultyNo: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, user_name, user_type, department_id, designation, branch_id')
      .eq('user_id', facultyNo)
      .eq('user_type', 'faculty')
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      throw new Error("Invalid faculty number. Faculty not found.");
    }
    const faculty: FacultySession = {
      user_id: data.user_id,
      user_name: data.user_name,
      user_type: data.user_type,
      department_id: data.department_id,
      designation: data.designation,
      branch_id: data.branch_id,
    };
    localStorage.setItem(FACULTY_SESSION_KEY, JSON.stringify(faculty));
    setRole("faculty");
    setUserName(faculty.user_name);
    setUserId(faculty.user_id);
    setFacultyData(faculty);
  };

  const signOut = async () => {
    if (role === "admin") {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(STUDENT_SESSION_KEY);
    localStorage.removeItem(FACULTY_SESSION_KEY);
    setRole(null);
    setUserName("");
    setUserId("");
    setStudentData(null);
    setFacultyData(null);
    setIsSuperAdmin(false);
    setAdminBranch(null);
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        userName,
        userId,
        studentData,
        facultyData,
        loading,
        isSuperAdmin,
        adminBranch,
        signInAdmin,
        signInStudent,
        signInFaculty,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
