import { Category, RequesterUser } from "./types";
export type { Category, RequesterUser };

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

// Issue 2 + Issue 4 — legacy system check
export async function checkSystem(): Promise<SystemStatus> {
  const healthRes = await fetch(`${API_URL}/api/health`);
  if (!healthRes.ok) {
    throw new Error("Unable to connect to TokTickIT API");
  }

  const catRes = await fetch(`${API_URL}/api/categories`);
  if (!catRes.ok) {
    throw new Error("Unable to connect to TokTickIT API");
  }

  const categories: Category[] = await catRes.json();
  return { online: true, categories };
}

// ---------------------------------------------------------------------------
// Lab 2 — Issue 6: Fetch Active Development Requesters
// GET /api/requesters/active
// ---------------------------------------------------------------------------
export async function fetchActiveRequesters(): Promise<RequesterUser[]> {
  const res = await fetch(`${API_URL}/api/requesters/active`);
  if (!res.ok) {
    throw new Error("Failed to fetch active development requesters from server");
  }
  return res.json();
}
