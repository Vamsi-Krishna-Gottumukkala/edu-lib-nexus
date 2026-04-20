import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, User, Eye, EyeOff, Loader2, Mail, Lock, LogIn } from "lucide-react";

export default function Login() {
  const { signInAdmin, signInStudent } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<"admin" | "student">("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInAdmin(email, password);
      navigate("/admin");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInStudent(rollNo);
      navigate("/student");
    } catch (err: any) {
      setError(err.message || "Roll number not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        {/* College Emblem */}
        <img src="/gvplogo.png" alt="GVP Logo" className="w-[45px] h-[45px] object-contain shrink-0" />
        <h1 className="text-[17px] md:text-[20px] font-bold text-slate-900 tracking-tight">
          Gayatri Vidya Parishad College for Degree and P.G Courses (A)
        </h1>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        
        {/* Central Logo & Title */}
        <div className="flex flex-col items-center pb-8">
          <div className="w-[48px] h-[48px] bg-blue-600 rounded-[14px] flex items-center justify-center shadow-sm mb-4">
            <BookOpen className="w-[22px] h-[22px] text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-[22px] font-bold text-slate-900 mb-1 tracking-tight">EduLibrary</h2>
          <p className="text-[13px] text-slate-500 font-medium">University Library Management System</p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-[420px] bg-white rounded-xl shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] border border-slate-200 overflow-hidden mb-12">
          
          <div className="p-8 pb-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Welcome back</h3>
              <p className="text-[13px] text-slate-500 mt-1.5">
                Sign in with your {tab === "admin" ? "institutional email" : "roll number"}
              </p>
            </div>

            {/* Subtle Tab Switcher */}
            <div className="flex justify-center mb-6">
              <div className="bg-slate-100 p-1 rounded-lg inline-flex">
                <button 
                  onClick={() => { setTab('admin'); setError(""); }} 
                  className={`px-4 py-1.5 text-[12px] font-semibold rounded-md transition-all ${tab === 'admin' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Admin
                </button>
                <button 
                  onClick={() => { setTab('student'); setError(""); }} 
                  className={`px-4 py-1.5 text-[12px] font-semibold rounded-md transition-all ${tab === 'student' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Student
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-[13px] text-center">
                {error}
              </div>
            )}

            {/* Admin Form */}
            {tab === "admin" && (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-[12px] text-slate-700 font-medium mb-1.5 flex items-center justify-between">
                    Email Address
                  </label>
                  <div className="flex items-center bg-white border border-slate-200 rounded-md focus-within:ring-2 focus-within:ring-[#1a65f8]/20 focus-within:border-[#1a65f8] overflow-hidden transition-all">
                    <Mail className="w-4 h-4 text-slate-400 ml-3.5 shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@institution.edu.in"
                      required
                      className="w-full px-3 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] text-slate-700 font-medium mb-1.5">
                    Password
                  </label>
                  <div className="flex items-center bg-white border border-slate-200 rounded-md focus-within:ring-2 focus-within:ring-[#1a65f8]/20 focus-within:border-[#1a65f8] overflow-hidden transition-all relative">
                    <Lock className="w-4 h-4 text-slate-400 ml-3.5 shrink-0" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full pl-3 pr-10 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#1a65f8] hover:bg-blue-700 text-white rounded-md text-[13px] font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-70 mt-2"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                  ) : (
                    <><LogIn className="w-4 h-4" /> Sign In</>
                  )}
                </button>
              </form>
            )}

            {/* Student Form */}
            {tab === "student" && (
              <form onSubmit={handleStudentLogin} className="space-y-4">
                <div>
                  <label className="block text-[12px] text-slate-700 font-medium mb-1.5 flex items-center justify-between">
                    Roll Number
                  </label>
                  <div className="flex items-center bg-white border border-slate-200 rounded-md focus-within:ring-2 focus-within:ring-[#1a65f8]/20 focus-within:border-[#1a65f8] overflow-hidden transition-all">
                    <User className="w-4 h-4 text-slate-400 ml-3.5 shrink-0" />
                    <input
                      type="text"
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                      placeholder="e.g. 5221411057"
                      required
                      className="w-full px-3 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Your password is your roll number.
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#1a65f8] hover:bg-blue-700 text-white rounded-md text-[13px] font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-70 mt-2"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Looking up...</>
                  ) : (
                    <><LogIn className="w-4 h-4" /> Access Portal</>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Card Footer */}
          <div className="border-t border-slate-100 py-4 px-8 bg-slate-50/50">
            <p className="text-[11px] text-slate-500 text-center">
              {tab === "admin" 
                ? "Use your institutional domain email to sign in." 
                : "Students do not require an email password to access the portal."}
            </p>
          </div>
        </div>

        {/* Page Footer */}
        <div className="text-[11px] text-slate-500 text-center">
          © 2026 EduLibrary. All rights reserved.
        </div>
      </div>
    </div>
  );
}
