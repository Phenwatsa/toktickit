import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { RequesterUser } from "../types";
import { fetchActiveRequesters } from "../api";
import { useAuth } from "./AuthContext";

interface RequesterContextType {
  currentRequester: RequesterUser | null;
  activeRequesters: RequesterUser[];
  isLoading: boolean;
  error: string | null;
  selectRequester: (requester: RequesterUser) => void;
  clearRequester: () => void;
  refreshRequesters: () => Promise<void>;
}

const RequesterContext = createContext<RequesterContextType | undefined>(undefined);

const STORAGE_KEY = "toktickit_selected_requester";

export function RequesterProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentRequester, setCurrentRequester] = useState<RequesterUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeRequesters, setActiveRequesters] = useState<RequesterUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sync currentRequester with authenticated user (when role is REQUESTER)
  useEffect(() => {
    if (user && user.role === "REQUESTER") {
      setCurrentRequester((prev) => {
        if (
          prev &&
          prev.id === user.id &&
          prev.name === user.name &&
          prev.email === user.email &&
          prev.department === (user.department || "General") &&
          prev.isActive === user.isActive
        ) {
          return prev;
        }
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          department: user.department || "General",
          isActive: user.isActive,
        };
      });
    } else if (user && user.role !== "REQUESTER") {
      setCurrentRequester((prev) => (prev !== null ? null : prev));
    }
  }, [user]);

  async function loadActiveRequesters() {
    setIsLoading(true);
    setError(null);
    try {
      const list = await fetchActiveRequesters();
      setActiveRequesters(list);

      // If stored requester is no longer in active list, clear it (unless user is authenticated)
      if (currentRequester && !user && !list.some((r) => r.id === currentRequester.id)) {
        setCurrentRequester(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requesters");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadActiveRequesters();
  }, []);

  function selectRequester(requester: RequesterUser) {
    setCurrentRequester(requester);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requester));
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  function clearRequester() {
    setCurrentRequester(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }

  return (
    <RequesterContext.Provider
      value={{
        currentRequester,
        activeRequesters,
        isLoading,
        error,
        selectRequester,
        clearRequester,
        refreshRequesters: loadActiveRequesters,
      }}
    >
      {children}
    </RequesterContext.Provider>
  );
}

export function useRequester() {
  const context = useContext(RequesterContext);
  if (!context) {
    throw new Error("useRequester must be used within a RequesterProvider");
  }
  return context;
}
