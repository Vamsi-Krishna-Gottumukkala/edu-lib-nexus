import React, { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "admin" | "student";

interface AuthContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  userName: string;
  userId: string;
}

const AuthContext = createContext<AuthContextType>({
  role: "admin",
  setRole: () => {},
  userName: "Admin User",
  userId: "ADM001",
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<UserRole>("admin");

  const userName = role === "admin" ? "Dr. Sarah Mitchell" : "John Anderson";
  const userId = role === "admin" ? "ADM001" : "STU2024001";

  return (
    <AuthContext.Provider value={{ role, setRole, userName, userId }}>
      {children}
    </AuthContext.Provider>
  );
};
