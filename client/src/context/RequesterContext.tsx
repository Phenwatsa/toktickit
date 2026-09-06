import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { RequesterUser } from "../types";
import { fetchActiveRequesters } from "../api";

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

  async function loadActiveRequesters() {
    setIsLoading(true);
    setError(null);
    try {
      const list = await fetchActiveRequesters();
      setActiveRequesters(list);

      // If stored requester is no longer in active list, clear it
      if (currentRequester && !list.some((r) => r.id === currentRequester.id)) {
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
