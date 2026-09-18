import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRequester } from "../context/RequesterContext";
import { useAuth } from "../context/AuthContext";
import {
  Ticket,
  Category,
  fetchActiveCategories,
  fetchMyTickets,
  PaginationMeta,
} from "../api";

interface MyTicketsProps {
  onNavigateToCreate: () => void;
  onSelectTicket?: (ticketId: number) => void;
}

export function MyTickets({ onNavigateToCreate, onSelectTicket }: MyTicketsProps) {
  const { currentRequester } = useRequester();
  const { user } = useAuth();

  const effectiveRequester = useMemo(() => {
    if (user && user.role === "REQUESTER") {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department || "General",
        isActive: user.isActive,
      };
    }
    return currentRequester;
  }, [user?.id, user?.name, user?.email, user?.department, user?.isActive, user?.role, currentRequester]);

  const effectiveRequesterId = effectiveRequester?.id;

  // Data State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Filter & Search State
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [priority, setPriority] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");
  const [sortOption, setSortOption] = useState<string>("createdAt_desc");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Status & Error State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Mobile Filter Modal State
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  const activeFilterCount = [
    categoryId !== "",
    priority !== "ALL",
    status !== "ALL",
    sortOption !== "createdAt_desc",
  ].filter(Boolean).length;

  const hasActiveFilters = Boolean(
    (search && search.trim() !== "") ||
      categoryId !== "" ||
      priority !== "ALL" ||
      status !== "ALL" ||
      sortOption !== "createdAt_desc"
  );

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load Categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await fetchActiveCategories();
        setCategories(cats);
      } catch (err) {
        console.error("Failed to load categories for filtering:", err);
      }
    }
    loadCategories();
  }, []);

  // Fetch Tickets
  const loadTickets = useCallback(async () => {
    if (!effectiveRequesterId) return;

    setIsLoading(true);
    setError(null);
    try {
      const parts = sortOption.split("_");
      const sortBy = parts[0];
      const sortOrder = parts[1] as "asc" | "desc";

      const res = await fetchMyTickets({
        requesterId: effectiveRequesterId,
        search: debouncedSearch.trim() || undefined,
        categoryId: categoryId !== "" ? Number(categoryId) : undefined,
        priority: priority !== "ALL" ? priority : undefined,
        status: status !== "ALL" ? status : undefined,
        sortBy,
        sortOrder,
        page: currentPage,
        pageSize: 10,
      });

      setTickets(res.data);
      setPagination(res.pagination);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setError(
        err instanceof Error ? err.message : "Failed to load support tickets."
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    effectiveRequesterId,
    debouncedSearch,
    categoryId,
    priority,
    status,
    sortOption,
    currentPage,
  ]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  function handleClearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setCategoryId("");
    setPriority("ALL");
    setStatus("ALL");
    setSortOption("createdAt_desc");
    setCurrentPage(1);
  }

  function handleHeaderSort(column: "createdAt" | "ticketNumber") {
    if (column === "createdAt") {
      setSortOption((prev) => (prev === "createdAt_desc" ? "createdAt_asc" : "createdAt_desc"));
    } else {
      setSortOption((prev) => (prev === "ticketNumber_asc" ? "ticketNumber_desc" : "ticketNumber_asc"));
    }
    setCurrentPage(1);
  }

  const renderSortIndicator = (column: "createdAt" | "ticketNumber") => {
    let active = false;
    let order = "desc";
    if (column === "createdAt") {
      active = sortOption.startsWith("createdAt");
      order = sortOption === "createdAt_asc" ? "asc" : "desc";
    } else if (column === "ticketNumber") {
      active = sortOption.startsWith("ticketNumber");
      order = sortOption === "ticketNumber_asc" ? "asc" : "desc";
    }

    if (!active) {
      return (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94A3B8"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginLeft: "0.35rem", verticalAlign: "-2px", flexShrink: 0, display: "inline-block" }}
          aria-hidden="true"
        >
          <path d="m7 15 5 5 5-5" />
          <path d="m7 9 5-5 5 5" />
        </svg>
      );
    }
    return order === "asc" ? (
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-primary, #006B3C)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginLeft: "0.35rem", verticalAlign: "-2px", flexShrink: 0, display: "inline-block" }}
        aria-hidden="true"
      >
        <path d="m18 15-6-6-6 6" />
      </svg>
    ) : (
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-primary, #006B3C)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginLeft: "0.35rem", verticalAlign: "-2px", flexShrink: 0, display: "inline-block" }}
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    );
  };

  function formatDate(dateStr: string): string {
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  }

  function renderPriorityBadge(p: string) {
    const classNameMap: Record<string, string> = {
      LOW: "zen-badge-priority-low",
      MEDIUM: "zen-badge-priority-medium",
      HIGH: "zen-badge-priority-high",
      URGENT: "zen-badge-priority-urgent",
    };
    return (
      <span
        className={`zen-badge ${classNameMap[p] || "zen-badge-priority-low"}`}
        data-testid={`badge-priority-${p.toLowerCase()}`}
      >
        {p.charAt(0) + p.slice(1).toLowerCase()}
      </span>
    );
  }

  function renderStatusBadge(s: string) {
    const classNameMap: Record<string, string> = {
      NEW: "zen-badge-new",
      OPEN: "zen-badge-open",
      IN_PROGRESS: "zen-badge-in-progress",
      PENDING: "zen-badge-pending",
      WAITING_FOR_REQUESTER: "zen-badge-pending",
      RESOLVED: "zen-badge-resolved",
      CLOSED: "zen-badge-closed",
      REOPENED: "zen-badge-open",
      CANCELLED: "zen-badge-cancelled",
    };
    const labelMap: Record<string, string> = {
      NEW: "New",
      OPEN: "Open",
      IN_PROGRESS: "In Progress",
      PENDING: "Pending",
      WAITING_FOR_REQUESTER: "Waiting for Requester",
      RESOLVED: "Resolved",
      CLOSED: "Closed",
      REOPENED: "Reopened",
      CANCELLED: "Cancelled",
    };
    return (
      <span
        className={`zen-badge ${classNameMap[s] || "zen-badge-new"}`}
        data-testid={`badge-status-${s.toLowerCase().replace(/_/g, "-")}`}
        style={s === "WAITING_FOR_REQUESTER" ? { whiteSpace: "normal", display: "inline-block", maxWidth: 110, lineHeight: 1.2, textAlign: "center", padding: "0.25rem 0.4rem" } : undefined}
      >
        {labelMap[s] || s}
      </span>
    );
  }

  return (
    <div className="zen-container py-3" style={{ paddingBottom: "3rem" }}>
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: 8,
                backgroundColor: "var(--color-pale-green)",
                color: "var(--color-primary)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M9 12h6" />
                <path d="M9 16h6" />
              </svg>
            </span>
            My Support Tickets
          </h1>
          <p className="text-muted mb-0 small">
            Showing tickets submitted by <strong>{effectiveRequester?.name}</strong>
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {pagination.totalItems > 0 && (
            <span
              className="badge bg-light text-dark border px-3 py-2"
              style={{ fontSize: "0.85rem", fontWeight: 600 }}
              data-testid="total-records-badge"
            >
              Total Tickets: {pagination.totalItems}
            </span>
          )}
          <button
            type="button"
            className="zen-btn-primary"
            onClick={onNavigateToCreate}
            data-testid="create-ticket-top-btn"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create New Ticket
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="zen-card mb-4"
        style={{
          padding: "1rem 1.25rem",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
        }}
        data-testid="filter-bar"
      >
        {/* Desktop Filter Bar (>= 768px) */}
        <div className="staff-filter-bar staff-filter-bar-desktop d-none d-md-flex">
          {/* Search Input */}
          <div className="staff-filter-search">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search ticket # or summary..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              data-testid="search-input"
              style={{
                borderRadius: "8px",
                borderColor: "#E2E8F0",
                backgroundColor: "#F8FAFC",
                paddingLeft: "2.1rem",
                fontSize: "0.85rem",
                height: "38px",
                width: "100%",
                transition: "all 0.15s ease",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-muted)",
                pointerEvents: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1);
                }}
                style={{
                  position: "absolute",
                  right: "0.6rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  padding: 0,
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Reset Filters Action */}
          <div className="staff-filter-reset">
            <button
              type="button"
              className="btn btn-sm"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              data-testid="clear-filters-btn"
              style={{
                backgroundColor: hasActiveFilters ? "var(--color-pale-green, #EAF6EF)" : "#F8FAFC",
                color: hasActiveFilters ? "var(--color-primary, #006B3C)" : "#94A3B8",
                border: hasActiveFilters ? "1px solid #C4E6D2" : "1px solid #E2E8F0",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "0.83rem",
                padding: "0 0.95rem",
                height: "38px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.35rem",
                whiteSpace: "nowrap",
                cursor: hasActiveFilters ? "pointer" : "not-allowed",
                transition: "all 0.15s ease",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>Reset Filters</span>
            </button>
          </div>

          {/* Responsive Line Break to keep Search + Reset together */}
          <div className="staff-filter-break" />

          {/* Status Filter */}
          <div className="staff-filter-select staff-filter-status">
            <select
              id="filterStatus"
              className="form-select form-select-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by Status"
              data-testid="status-filter"
              style={{
                borderRadius: "8px",
                borderColor: "#E2E8F0",
                fontSize: "0.85rem",
                fontWeight: 500,
                height: "38px",
                width: "100%",
                color: "#334155",
                transition: "all 0.15s ease",
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING">Pending</option>
              <option value="WAITING_FOR_REQUESTER">Waiting for Requester</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="staff-filter-select staff-filter-category">
            <select
              id="filterCategory"
              className="form-select form-select-sm"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value ? Number(e.target.value) : "");
                setCurrentPage(1);
              }}
              aria-label="Filter by Category"
              data-testid="category-filter"
              style={{
                borderRadius: "8px",
                borderColor: "#E2E8F0",
                fontSize: "0.85rem",
                fontWeight: 500,
                height: "38px",
                width: "100%",
                color: "#334155",
                transition: "all 0.15s ease",
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="staff-filter-select staff-filter-priority">
            <select
              id="filterPriority"
              className="form-select form-select-sm"
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by Priority"
              data-testid="priority-filter"
              style={{
                borderRadius: "8px",
                borderColor: "#E2E8F0",
                fontSize: "0.85rem",
                fontWeight: 500,
                height: "38px",
                width: "100%",
                color: "#334155",
                transition: "all 0.15s ease",
              }}
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Sort Control */}
          <div className="staff-filter-select staff-filter-owner">
            <select
              id="filterSort"
              className="form-select form-select-sm"
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Sort tickets"
              data-testid="sort-select"
              style={{
                borderRadius: "8px",
                borderColor: "#E2E8F0",
                fontSize: "0.85rem",
                fontWeight: 500,
                height: "38px",
                width: "100%",
                color: "#334155",
                transition: "all 0.15s ease",
              }}
            >
              <option value="createdAt_desc">Date (Newest)</option>
              <option value="createdAt_asc">Date (Oldest)</option>
              <option value="ticketNumber_asc">Ticket # (Asc)</option>
              <option value="ticketNumber_desc">Ticket # (Desc)</option>
              <option value="updatedAt_desc">Recently Updated</option>
            </select>
          </div>
        </div>

        {/* Mobile Filter Bar (< 768px): Compact Search + Filter Modal Button */}
        <div className="staff-filter-bar-mobile d-flex d-md-none align-items-center gap-2 w-100">
          <div className="zen-search-wrapper" style={{ flex: 1 }}>
            <span className="zen-search-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className="zen-search-input"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <button
            type="button"
            className={`zen-btn-filter-trigger ${activeFilterCount > 0 ? "has-active" : ""}`}
            onClick={() => setIsMobileFilterOpen(true)}
            data-testid="mobile-filter-trigger-btn"
            aria-label="Open Filter Options"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="zen-filter-badge-count">{activeFilterCount}</span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              className="zen-btn-clear-filters"
              onClick={handleClearFilters}
              style={{ padding: "0.45rem 0.6rem" }}
              title="Reset all filters"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Filter Modal Bottom-Sheet */}
      {isMobileFilterOpen && (
        <div
          className="zen-filter-modal-backdrop"
          onClick={() => setIsMobileFilterOpen(false)}
          data-testid="mobile-filter-modal-backdrop"
        >
          <div
            className="zen-filter-modal-panel"
            onClick={(e) => e.stopPropagation()}
            data-testid="mobile-filter-modal"
          >
            <div className="zen-filter-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "7px",
                    backgroundColor: "var(--color-pale-green)",
                    color: "var(--color-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                </div>
                <h3 className="zen-filter-modal-title">Filter & Sort Tickets</h3>
              </div>
              <button
                type="button"
                className="zen-drawer-close-btn"
                onClick={() => setIsMobileFilterOpen(false)}
                aria-label="Close Filter Modal"
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1.25rem" }}>
              {/* Category */}
              <div>
                <label className="zen-form-label" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                  Category
                </label>
                <select
                  className="zen-form-control"
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value ? Number(e.target.value) : "");
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="zen-form-label" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                  Priority Level
                </label>
                <select
                  className="zen-form-control"
                  value={priority}
                  onChange={(e) => {
                    setPriority(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="ALL">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="zen-form-label" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                  Ticket Status
                </label>
                <select
                  className="zen-form-control"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="NEW">New</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="PENDING">Pending</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="zen-form-label" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                  Sort Order
                </label>
                <select
                  className="zen-form-control"
                  value={sortOption}
                  onChange={(e) => {
                    setSortOption(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="createdAt_desc">Date Created (Newest First)</option>
                  <option value="createdAt_asc">Date Created (Oldest First)</option>
                  <option value="ticketNumber_asc">Ticket Number (Ascending)</option>
                  <option value="ticketNumber_desc">Ticket Number (Descending)</option>
                  <option value="updatedAt_desc">Recently Updated</option>
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "space-between" }}>
              <button
                type="button"
                className="zen-btn-secondary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => {
                  handleClearFilters();
                  setIsMobileFilterOpen(false);
                }}
              >
                Clear All
              </button>
              <button
                type="button"
                className="zen-btn-primary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setIsMobileFilterOpen(false)}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div style={{ padding: "0.75rem 1rem", backgroundColor: "var(--color-error-bg)", border: "1px solid #FECACA", borderRadius: "8px", color: "var(--color-error)", fontSize: "0.875rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span><strong>Error:</strong> {error}</span>
          <button
            type="button"
            className="zen-btn-secondary"
            style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
            onClick={loadTickets}
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Table Content */}
      {isLoading ? (
        <div className="zen-card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <div style={{ display: "inline-block", width: "24px", height: "24px", border: "3px solid #CBD5E1", borderTopColor: "var(--color-primary)", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "0.75rem" }} />
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", margin: 0 }}>
            Loading your tickets...
          </p>
        </div>
      ) : tickets.length === 0 ? (
        hasActiveFilters ? (
          /* No-Results State */
          <div className="zen-empty-state" data-testid="no-results-state">
            <div className="zen-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className="zen-empty-title">No matching tickets found</h3>
            <p className="zen-empty-desc">
              No tickets matched your filter criteria. Try adjusting your search query or reset filters.
            </p>
            <button
              type="button"
              className="zen-btn-clear-filters"
              onClick={handleClearFilters}
              data-testid="no-results-clear-btn"
              style={{ margin: "0 auto", padding: "0.5rem 1.25rem" }}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          /* Empty State */
          <div className="zen-empty-state" data-testid="empty-state">
            <div className="zen-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="zen-empty-title">You haven't submitted any tickets yet</h3>
            <p className="zen-empty-desc">
              When you submit a technical issue or service request, it will appear here for tracking.
            </p>
            <button
              type="button"
              className="zen-btn-primary"
              onClick={onNavigateToCreate}
              data-testid="empty-state-create-btn"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Your First Ticket
            </button>
          </div>
        )
      ) : (
        /* Populated Table View */
        <div
          className="zen-card p-0 overflow-hidden shadow-sm"
          data-testid="tickets-table-card"
          style={{
            backgroundColor: "#FFFFFF",
            opacity: isLoading ? 0.65 : 1,
            transition: "opacity 0.2s ease",
          }}
        >
          <div
            className="table-responsive"
            style={{
              maxHeight: "calc(100vh - 275px)",
              overflowY: "auto",
              overflowX: "auto",
            }}
          >
            <table
              className="zen-table mb-0 w-100"
              style={{
                tableLayout: "fixed",
                width: "100%",
                minWidth: "1080px",
                fontSize: "0.875rem",
              }}
              data-testid="tickets-table"
            >
              <colgroup>
                <col style={{ width: 140 }} />
                <col style={{ width: 110 }} />
                <col />
                <col style={{ width: 130 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 125 }} />
                <col style={{ width: 90 }} />
              </colgroup>
              <thead>
                <tr>
                  <th
                    style={{
                      cursor: "pointer",
                      position: "sticky",
                      top: 0,
                      zIndex: 5,
                      backgroundColor: "#F8FAFC",
                      boxShadow: "0 1px 0 var(--color-border)",
                      whiteSpace: "nowrap",
                    }}
                    onClick={() => handleHeaderSort("ticketNumber")}
                    data-testid="sort-ticketNumber"
                  >
                    Ticket # {renderSortIndicator("ticketNumber")}
                  </th>
                  <th
                    style={{
                      cursor: "pointer",
                      position: "sticky",
                      top: 0,
                      zIndex: 5,
                      backgroundColor: "#F8FAFC",
                      boxShadow: "0 1px 0 var(--color-border)",
                      whiteSpace: "nowrap",
                    }}
                    onClick={() => handleHeaderSort("createdAt")}
                    data-testid="sort-createdAt"
                  >
                    Created {renderSortIndicator("createdAt")}
                  </th>
                  <th
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 5,
                      backgroundColor: "#F8FAFC",
                      boxShadow: "0 1px 0 var(--color-border)",
                    }}
                  >
                    Summary
                  </th>
                  <th
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 5,
                      backgroundColor: "#F8FAFC",
                      boxShadow: "0 1px 0 var(--color-border)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Category
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      position: "sticky",
                      top: 0,
                      zIndex: 5,
                      backgroundColor: "#F8FAFC",
                      boxShadow: "0 1px 0 var(--color-border)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Priority
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      position: "sticky",
                      top: 0,
                      zIndex: 5,
                      backgroundColor: "#F8FAFC",
                      boxShadow: "0 1px 0 var(--color-border)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      position: "sticky",
                      top: 0,
                      zIndex: 5,
                      backgroundColor: "#F8FAFC",
                      boxShadow: "0 1px 0 var(--color-border)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    data-testid={`ticket-row-${t.id}`}
                    onClick={() => onSelectTicket && onSelectTicket(t.id)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Ticket Number */}
                    <td className="fw-semibold text-primary" style={{ whiteSpace: "nowrap", verticalAlign: "middle" }}>
                      <span className="zen-ticket-number">
                        {t.ticketNumber}
                      </span>
                    </td>

                    {/* Date Created */}
                    <td className="text-muted" style={{ fontSize: "0.85rem", whiteSpace: "nowrap", verticalAlign: "middle" }}>
                      {formatDate(t.createdAt)}
                    </td>

                    {/* Summary */}
                    <td style={{ verticalAlign: "middle" }}>
                      <div
                        className="text-dark fw-medium"
                        style={{
                          wordBreak: "break-word",
                          lineHeight: 1.35,
                        }}
                      >
                        {t.summary}
                      </div>
                      <div className="zen-ticket-meta" style={{ marginTop: "3px" }}>
                        <span>System: {t.relatedSystem?.name || "General"}</span>
                        {t.attachmentsCount !== undefined && t.attachmentsCount > 0 && (
                          <span style={{ backgroundColor: "#F1F5F9", padding: "1px 6px", borderRadius: "4px", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                            {t.attachmentsCount}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ color: "#334155", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                      {t.category?.name || "General"}
                    </td>

                    {/* Requested Priority */}
                    <td style={{ textAlign: "center", whiteSpace: "nowrap", verticalAlign: "middle" }}>
                      {renderPriorityBadge(t.requestedPriority)}
                    </td>

                    {/* Current Status */}
                    <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                      {renderStatusBadge(t.currentStatus)}
                    </td>

                    {/* Action Button */}
                    <td style={{ textAlign: "center", whiteSpace: "nowrap", verticalAlign: "middle", padding: "0.75rem 1rem" }}>
                      <button
                        type="button"
                        className="zen-btn-view"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket && onSelectTicket(t.id);
                        }}
                        title="View details"
                        data-testid={`view-ticket-${t.id}`}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div
            className="zen-pagination d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 p-3 border-top"
            style={{ backgroundColor: "#FAFCFA" }}
          >
            <div className="text-muted small" data-testid="pagination-info">
              Showing <strong>{tickets.length > 0 ? (pagination.page - 1) * pagination.pageSize + 1 : 0}</strong> to{" "}
              <strong>{Math.min(pagination.page * pagination.pageSize, pagination.totalItems)}</strong> of{" "}
              <strong>{pagination.totalItems}</strong> tickets
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={!pagination.hasPrevPage}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                data-testid="pagination-prev-btn"
                style={{ fontSize: "0.8rem", padding: "0.25rem 0.65rem", borderRadius: "var(--radius-btn)" }}
              >
                Previous
              </button>

              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155" }}>
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={!pagination.hasNextPage}
                onClick={() => setCurrentPage((p) => p + 1)}
                data-testid="pagination-next-btn"
                style={{ fontSize: "0.8rem", padding: "0.25rem 0.65rem", borderRadius: "var(--radius-btn)" }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
