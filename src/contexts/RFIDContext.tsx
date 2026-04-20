import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useAuth } from "./AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface RFIDContextType {
  latestUid: string;
  setLatestUid: (uid: string) => void;
  isConnected: boolean;
}

const RFIDContext = createContext<RFIDContextType | undefined>(undefined);

export function RFIDProvider({ children }: { children: React.ReactNode }) {
  const { adminBranch } = useAuth();
  const queryClient = useQueryClient();
  const branchId = adminBranch?.branch_id;
  
  const [latestUid, setLatestUid] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [popup, setPopup] = useState<{ visible: boolean; type: "login" | "logout" | "unregistered"; uid?: string; userName?: string; userId?: string; userType?: string } | null>(null);
  
  const sseRef = useRef<EventSource | null>(null);
  const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showPopup = (data: any) => {
    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    setPopup({ visible: true, ...data });
    popupTimeoutRef.current = setTimeout(() => {
      setPopup((prev) => (prev ? { ...prev, visible: false } : null));
      setTimeout(() => setPopup(null), 300); // Wait for transition
    }, 2500);
  };

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000/api/events";
    
    console.log(`📡 Connecting to RFID Event Stream at ${backendUrl}`);
    const source = new EventSource(backendUrl);
    sseRef.current = source;

    source.onopen = () => {
      setIsConnected(true);
      console.log("🟢 Connected to RFID Stream");
    };

    source.onerror = (err) => {
      console.error("🔴 SSE Error:", err);
      setIsConnected(false);
    };

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Ensure the scan event is meant for this logged-in campus admin
        // (if branchId is null, it might be a super-admin, who can see everything?
        // Let's restrict it so they only see events from their branch to prevent noise)
        if (data.branch_id !== undefined && branchId !== undefined && data.branch_id !== branchId) {
          return; // Ignore events from other campuses
        }

        switch (data.type) {
          case "connected":
            // Connection established ping
            break;
            
          case "scan":
            console.log(`🔹 Global Scan Received: ${data.uid}`);
            setLatestUid(data.uid);
            break;
            
          case "unregistered":
            showPopup({ type: "unregistered", uid: data.uid });
            break;
            
          case "login":
            showPopup({ type: "login", uid: data.uid, userName: data.user_name, userId: data.user_id, userType: data.user_type });
            queryClient.invalidateQueries({ queryKey: ["today-logs"] });
            queryClient.invalidateQueries({ queryKey: ["rfid-logs"] });
            queryClient.invalidateQueries({ queryKey: ["attendance-stats"] });
            queryClient.invalidateQueries({ queryKey: ["today-count"] });
            queryClient.invalidateQueries({ queryKey: ["recent-logs"] });
            queryClient.invalidateQueries({ queryKey: ["today-branch-counts"] });
            break;
            
          case "logout":
            showPopup({ type: "logout", uid: data.uid, userName: data.user_name, userId: data.user_id, userType: data.user_type });
            queryClient.invalidateQueries({ queryKey: ["today-logs"] });
            queryClient.invalidateQueries({ queryKey: ["rfid-logs"] });
            queryClient.invalidateQueries({ queryKey: ["attendance-stats"] });
            queryClient.invalidateQueries({ queryKey: ["today-count"] });
            queryClient.invalidateQueries({ queryKey: ["recent-logs"] });
            queryClient.invalidateQueries({ queryKey: ["today-branch-counts"] });
            break;
        }
      } catch (err) {
        console.error("Failed to parse SSE message", err);
      }
    };

    return () => {
      source.close();
      setIsConnected(false);
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    };
  }, [branchId]);

  return (
    <RFIDContext.Provider value={{ latestUid, setLatestUid, isConnected }}>
      {children}
      
      {/* Floating Card Overlay */}
      <div 
        className={`fixed top-12 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 pointer-events-none ${
          popup && popup.visible ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0"
        }`}
      >
        {popup && (
          <div className="w-[350px] bg-card rounded-xl border border-border shadow-2xl overflow-hidden pointer-events-auto">
            {popup.type === "unregistered" ? (
              <div className="bg-[#FF9800] p-4 text-white text-center font-bold text-lg">
                ⚠️ Card not recognized ({popup.uid})
              </div>
            ) : (
              <>
                <div className={`p-2 text-center text-white font-bold text-lg ${popup.type === "login" ? "bg-[#31a24c]" : "bg-[#65676b]"}`}>
                  {popup.type === "login" ? "Welcome" : "Thank You"}
                </div>
                <div className="flex items-center gap-4 p-4 text-card-foreground">
                  <div className="w-[70px] h-[70px] rounded-full bg-muted flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-[1.25rem] truncate m-0 mb-1 leading-tight">{popup.userName}</h2>
                    <p className="text-muted-foreground text-[0.95rem] truncate m-0 mb-0.5">{popup.userId}</p>
                    <p className="text-muted-foreground text-[0.95rem] truncate m-0 capitalize flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
                       {popup.userType || "Unknown"} Type
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </RFIDContext.Provider>
  );
}

export function useRFID() {
  const context = useContext(RFIDContext);
  if (context === undefined) {
    throw new Error("useRFID must be used within an RFIDProvider");
  }
  return context;
}
