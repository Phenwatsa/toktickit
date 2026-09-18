import React, { useState, useEffect, useCallback } from "react";
import {
  StaffTicketItem,
  StaffTicketOwner,
  StaffQueuePagination,
  Category,
  fetchStaffTickets,
  fetchStaffMembers,
  fetchActiveCategories,
} from "../api";
import { useAuth } from "../context/AuthContext";

interface StaffTicketQueueProps {
  onSelectTicket?: (ticketId: number) => void;
}

export function StaffTicketQueue({ onSelectTicket }: StaffTicketQueueProps) {
  const { user } = useAuth();

  // Data State
  const [tickets, setTickets] = useState<StaffTicketItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffTicketOwner[]>([]);
  const [pagination, setPagination] = useState<StaffQueuePagination>({
    page: 1,
    pageSize: 10,
    totalRecords: 0,
    totalPages: 1,
  });

  // Filter & Search State
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [status, setStatus] = useState<string>("ALL");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [requestedPriority, setRequestedPriority] = useState<string>("ALL");
  const [itPriority, setItPriority] = useState<string>("ALL");
  const [ownerId, setOwnerId] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt" | "ticketNumber" | "itPriority">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Status & Error State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSystemTickets, setTotalSystemTickets] = useState<number | null>(null);

  // Mobile Filter Modal State
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  const activeFilterCount = [
    status !== "ALL",
    categoryId !== "",
    requestedPriority !== "ALL",
    itPriority !== "ALL",
    ownerId !== "ALL",
    sortBy !== "createdAt" || sortOrder !== "desc",
  ].filter(Boolean).length;

  const hasActiveFilters = Boolean(
    (search && search.trim() !== "") ||
      status !== "ALL" ||
      categoryId !== "" ||
      requestedPriority !== "ALL" ||
      itPriority !== "ALL" ||
      ownerId !== "ALL" ||
      sortBy !== "createdAt" ||
      sortOrder !== "desc"
  );

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load Categories and Staff Members once
  useEffect(() => {
    fetchActiveCategories()
      .then((cats) => setCategories(cats))
      .catch((err) => console.error("Failed to load categories:", err));

    fetchStaffMembers()
      .then((members) => setStaffMembers(members))
      .catch((err) => console.error("Failed to load staff members:", err));
  }, []);

  // Fetch Tickets
  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchStaffTickets({
        search: debouncedSearch.trim() || undefined,
        status: status !== "ALL" ? status : undefined,
        categoryId: categoryId !== "" ? Number(categoryId) : undefined,
        requestedPriority: requestedPriority !== "ALL" ? requestedPriority : undefined,
        itPriority: itPriority !== "ALL" ? itPriority : undefined,
        ownerId: ownerId !== "ALL" ? ownerId : undefined,
        sortBy,
        sortOrder,
        page: currentPage,
        pageSize,
      });

      setTickets(res.data);
      setPagination(res.pagination);

      // Record total system count when no filters are active to detect true empty state
      if (!hasActiveFilters && debouncedSearch.trim() === "") {
        setTotalSystemTickets(res.pagination.totalRecords);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff ticket queue");
    } finally {
      setIsLoading(false);
    }
  }, [
    debouncedSearch,
    status,
    categoryId,
    requestedPriority,
    itPriority,
    ownerId,
    sortBy,
    sortOrder,
    currentPage,
    pageSize,
    hasActiveFilters,
  ]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  function handleResetFilters() {
    setSearch("");
    setDebouncedSearch("");
    setStatus("ALL");
    setCategoryId("");
    setRequestedPriority("ALL");
    setItPriority("ALL");
    setOwnerId("ALL");
    setSortBy("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
  }

  function handleSort(column: "createdAt" | "updatedAt" | "ticketNumber" | "itPriority") {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  }

  function handleTicketClick(ticketId: number) {
    if (onSelectTicket) {
      onSelectTicket(ticketId);
    } else {
      window.location.hash = `#/ticket/${ticketId}`;
    }
  }

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

  function renderPriorityBadge(p: string, isRequested = false) {
    const classNameMap: Record<string, string> = {
      LOW: "zen-badge-priority-low",
      MEDIUM: "zen-badge-priority-medium",
      HIGH: "zen-badge-priority-high",
      URGENT: "zen-badge-priority-urgent",
    };
    const testId = isRequested
      ? `badge-requested-priority-${p.toLowerCase()}`
      : `badge-it-priority-${p.toLowerCase()}`;

    return (
      <span
        className={`zen-badge ${classNameMap[p] || "zen-badge-priority-low"}`}
        data-testid={testId}
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
      WAITING_FOR_REQUESTER: "Waiting for Requester",
      RESOLVED: "Resolved",
      CLOSED: "Closed",
      REOPENED: "Reopened",
      CANCELLED: "Cancelled",
    };
    const isWaiting = s === "WAITING_FOR_REQUESTER";
    return (
      <span
        className={`zen-badge ${classNameMap[s] || "zen-badge-new"} ${isWaiting ? "zen-badge-multiline" : ""}`}
        data-testid={`badge-status-${s.toLowerCase().replace(/_/g, "-")}`}
      >
        {labelMap[s] || s}
      </span>
    );
  }

  const renderSortIndicator = (column: string) => {
    if (sortBy !== column) {
      return (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#64748B"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginLeft: "0.35rem", verticalAlign: "-2px", opacity: 0.85, flexShrink: 0, display: "inline-block" }}
          aria-hidden="true"
        >
          <path d="m7 15 5 5 5-5" />
          <path d="m7 9 5-5 5 5" />
        </svg>
      );
    }
    return sortOrder === "asc" ? (
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

  const isTrulyEmpty = !isLoading && tickets.length === 0 && !hasActiveFilters && (totalSystemTickets === 0 || totalSystemTickets === null);
  const isNoResults = !isLoading && tickets.length === 0 && (hasActiveFilters || (totalSystemTickets !== null && totalSystemTickets > 0));

  return (
    <div className="zen-container py-3" data-testid="staff-ticket-queue-page">
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
            IT Staff Ticket Queue
          </h1>
          <p className="text-muted mb-0 small">
            Manage, triage, and track all incoming user support requests across departments.
          </p>
        </div>

        {pagination.totalRecords > 0 && (
          <div className="d-flex align-items-center gap-2">
            <span
              className="badge bg-light text-dark border px-3 py-2"
              style={{ fontSize: "0.85rem", fontWeight: 600 }}
              data-testid="total-records-badge"
            >
              Total Tickets: {pagination.totalRecords}
            </span>
          </div>
        )}
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
        data-testid="staff-queue-filters"
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
              onChange={(e) => setSearch(e.target.value)}
              data-testid="staff-queue-search-input"
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
                onClick={() => setSearch("")}
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
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
              data-testid="staff-queue-reset-filters-btn"
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
              className="form-select form-select-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setCurrentPage(1);
              }}
              data-testid="staff-queue-status-filter"
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
              <option value="WAITING_FOR_REQUESTER">Waiting for Requester</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REOPENED">Reopened</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="staff-filter-select staff-filter-category">
            <select
              className="form-select form-select-sm"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value === "" ? "" : Number(e.target.value));
                setCurrentPage(1);
              }}
              data-testid="staff-queue-category-filter"
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

          {/* Priority Filter (Requested Priority) */}
          <div className="staff-filter-select staff-filter-req-priority">
            <select
              className="form-select form-select-sm"
              value={requestedPriority}
              onChange={(e) => {
                setRequestedPriority(e.target.value);
                setCurrentPage(1);
              }}
              data-testid="staff-queue-req-priority-filter"
              aria-label="Filter by Requested Priority"
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
              <option value="ALL">All Req Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Priority Filter (IT Priority) */}
          <div className="staff-filter-select staff-filter-priority">
            <select
              className="form-select form-select-sm"
              value={itPriority}
              onChange={(e) => {
                setItPriority(e.target.value);
                setCurrentPage(1);
              }}
              data-testid="staff-queue-it-priority-filter"
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
              <option value="ALL">All IT Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Owner Filter */}
          <div className="staff-filter-select staff-filter-owner">
            <select
              className="form-select form-select-sm"
              value={ownerId}
              onChange={(e) => {
                setOwnerId(e.target.value);
                setCurrentPage(1);
              }}
              data-testid="staff-queue-owner-filter"
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
              <option value="ALL">All Owners</option>
              <option value="unassigned">Unassigned</option>
              {user && (
                <option value={String(user.id)}>Assigned to Me ({user.name})</option>
              )}
              {staffMembers
                .filter((m) => m.id !== user?.id)
                .map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {m.name}
                  </option>
                ))}
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
              placeholder="Search ticket # or summary..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            type="button"
            className={`zen-btn-filter-trigger ${activeFilterCount > 0 ? "has-active" : ""}`}
            onClick={() => setIsMobileFilterOpen(true)}
            data-testid="staff-queue-mobile-filter-trigger-btn"
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
              onClick={handleResetFilters}
              style={{ padding: "0.45rem 0.6rem" }}
              title="Reset all filters"
              data-testid="staff-queue-mobile-reset-btn"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Filter Modal Bottom-Sheet (< 768px) */}
      {isMobileFilterOpen && (
        <div
          className="zen-filter-modal-backdrop"
          onClick={() => setIsMobileFilterOpen(false)}
          data-testid="staff-queue-mobile-filter-backdrop"
        >
          <div
            className="zen-filter-modal-panel"
            onClick={(e) => e.stopPropagation()}
            data-testid="staff-queue-mobile-filter-modal"
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
                <h3 className="zen-filter-modal-title">Filter & Sort Staff Queue</h3>
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
              {/* Ticket Status */}
              <div>
                <label className="zen-form-label" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                  Status
                </label>
                <select
                  className="zen-filter-select w-100"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  data-testid="staff-queue-mobile-status-filter"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="NEW">New</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="WAITING_FOR_REQUESTER">Waiting for Requester</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                  <option value="REOPENED">Reopened</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="zen-form-label" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                  Category
                </label>
                <select
                  className="zen-filter-select w-100"
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value === "" ? "" : Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  data-testid="staff-queue-mobile-category-filter"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Requested Priority */}
              <div>
                <label className="zen-form-label" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                  Requested Priority
                </label>
                <select
                  className="zen-filter-select w-100"
                  value={requestedPriority}
                  onChange={(e) => {
                    setRequestedPriority(e.target.value);
                    setCurrentPage(1);
                  }}
                  data-testid="staff-queue-mobile-req-priority-filter"
                  aria-label="Filter by Requested Priority"
                >
                  <option value="ALL">All Req Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              {/* IT Priority */}
              <div>
                <label className="zen-form-label" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                  IT Priority
                </label>
                <select
                  className="zen-filter-select w-100"
                  value={itPriority}
                  onChange={(e) => {
                    setItPriority(e.target.value);
                    setCurrentPage(1);
                  }}
                  data-testid="staff-queue-mobile-it-priority-filter"
                >
                  <option value="ALL">All IT Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              {/* Owner */}
              <div>
                <label className="zen-form-label" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                  Assigned Owner
                </label>
                <select
                  className="zen-filter-select w-100"
                  value={ownerId}
                  onChange={(e) => {
                    setOwnerId(e.target.value);
                    setCurrentPage(1);
                  }}
                  data-testid="staff-queue-mobile-owner-filter"
                >
                  <option value="ALL">All Owners</option>
                  <option value="unassigned">Unassigned</option>
                  {user && (
                    <option value={String(user.id)}>Assigned to Me ({user.name})</option>
                  )}
                  {staffMembers
                    .filter((m) => m.id !== user?.id)
                    .map((m) => (
                      <option key={m.id} value={String(m.id)}>
                        {m.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="zen-form-label" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                  Sort Order
                </label>
                <select
                  className="zen-filter-select w-100"
                  value={`${sortBy}_${sortOrder}`}
                  onChange={(e) => {
                    const [by, order] = e.target.value.split("_") as [typeof sortBy, typeof sortOrder];
                    setSortBy(by);
                    setSortOrder(order);
                    setCurrentPage(1);
                  }}
                  data-testid="staff-queue-mobile-sort-filter"
                >
                  <option value="createdAt_desc">Date Created (Newest First)</option>
                  <option value="createdAt_asc">Date Created (Oldest First)</option>
                  <option value="ticketNumber_asc">Ticket # (Ascending)</option>
                  <option value="ticketNumber_desc">Ticket # (Descending)</option>
                  <option value="itPriority_desc">IT Priority (Highest First)</option>
                  <option value="itPriority_asc">IT Priority (Lowest First)</option>
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
                  handleResetFilters();
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

      {/* Error State */}
      {error && (
        <div
          className="alert alert-danger d-flex align-items-center justify-content-between mb-4 shadow-sm"
          role="alert"
          data-testid="staff-queue-error"
          style={{ borderRadius: "var(--radius-btn)" }}
        >
          <div>
            <strong>Error loading queue:</strong> {error}
          </div>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() => loadTickets()}
            data-testid="staff-queue-retry-btn"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && tickets.length === 0 && (
        <div
          className="zen-card text-center py-5"
          data-testid="staff-queue-loading"
          style={{ minHeight: 280 }}
        >
          <div className="spinner-border text-success mb-3" role="status" style={{ width: "2.5rem", height: "2.5rem" }}>
            <span className="visually-hidden">Loading ticket queue...</span>
          </div>
          <p className="text-muted fw-semibold mb-0">Loading staff ticket queue...</p>
        </div>
      )}

      {/* Empty System Queue State */}
      {isTrulyEmpty && (
        <div
          className="zen-card text-center py-5 my-3"
          data-testid="staff-queue-empty"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "var(--color-pale-green)",
              color: "var(--color-primary)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <h2 className="h5 fw-bold text-dark mb-2">No tickets found in the queue</h2>
          <p className="text-muted mb-0" style={{ maxWidth: 440, margin: "0 auto" }}>
            The IT staff queue is currently clear. When users submit support tickets, they will appear here.
          </p>
        </div>
      )}

      {/* No Results Filter State */}
      {isNoResults && (
        <div
          className="zen-card text-center py-5 my-3"
          data-testid="staff-queue-no-results"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "var(--color-pale-green)",
              color: "var(--color-primary)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h2 className="h5 fw-bold text-dark mb-2">No tickets match your filter criteria</h2>
          <p className="text-muted mb-3" style={{ maxWidth: 460, margin: "0 auto" }}>
            Try adjusting your search terms, changing the status filter, or clearing filters to view all tickets.
          </p>
          <button
            type="button"
            className="zen-btn-primary"
            onClick={handleResetFilters}
            data-testid="no-results-reset-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            <span>Reset Filters</span>
          </button>
        </div>
      )}

      {/* Tickets Display: Desktop Table + Mobile Cards */}
      {tickets.length > 0 && (
        <div
          className="zen-card p-0 overflow-hidden shadow-sm"
          style={{
            backgroundColor: "#FFFFFF",
            opacity: isLoading ? 0.65 : 1,
            transition: "opacity 0.2s ease",
          }}
        >
          {/* Desktop Table View (>= 1200px) */}
          <div
            className="table-responsive d-none d-xl-block"
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
                minWidth: "1190px",
                fontSize: "0.875rem",
              }}
            >
              <colgroup>
                <col style={{ width: 130 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 250, minWidth: 240 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 105 }} />
                <col style={{ width: 115 }} />
                <col style={{ width: 75 }} />
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
                    }}
                    onClick={() => handleSort("ticketNumber")}
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
                    }}
                    onClick={() => handleSort("createdAt")}
                    data-testid="sort-createdAt"
                  >
                    Created {renderSortIndicator("createdAt")}
                  </th>
                  <th
                    style={{
                      cursor: "pointer",
                      position: "sticky",
                      top: 0,
                      zIndex: 5,
                      backgroundColor: "#F8FAFC",
                      boxShadow: "0 1px 0 var(--color-border)",
                    }}
                    onClick={() => handleSort("updatedAt")}
                    data-testid="sort-updatedAt"
                  >
                    Updated {renderSortIndicator("updatedAt")}
                  </th>
                  <th
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 5,
                      backgroundColor: "#F8FAFC",
                      boxShadow: "0 1px 0 var(--color-border)",
                      minWidth: 240,
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
                    Req Priority
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
                    onClick={() => handleSort("itPriority")}
                    data-testid="sort-itPriority"
                  >
                    <span style={{ display: "inline-flex", alignItems: "center" }}>
                      IT Priority {renderSortIndicator("itPriority")}
                    </span>
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      position: "sticky",
                      top: 0,
                      zIndex: 5,
                      backgroundColor: "#F8FAFC",
                      boxShadow: "0 1px 0 var(--color-border)",
                    }}
                  >
                    Status
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
                    Owner
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      position: "sticky",
                      top: 0,
                      zIndex: 5,
                      backgroundColor: "#F8FAFC",
                      boxShadow: "0 1px 0 var(--color-border)",
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
                    onClick={() => handleTicketClick(t.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="fw-semibold text-primary" style={{ whiteSpace: "nowrap", verticalAlign: "middle" }}>
                      {t.ticketNumber}
                    </td>
                    <td className="text-muted" style={{ whiteSpace: "nowrap", verticalAlign: "middle" }}>
                      {formatDate(t.createdAt)}
                    </td>
                    <td className="text-muted" style={{ whiteSpace: "nowrap", verticalAlign: "middle" }}>
                      {formatDate(t.updatedAt || t.createdAt)}
                    </td>
                    <td style={{ verticalAlign: "middle", minWidth: 240 }}>
                      <div
                        className="text-dark fw-medium"
                        style={{
                          wordBreak: "break-word",
                          lineHeight: 1.4,
                        }}
                      >
                        {t.summary}
                      </div>
                      {t.requester && (
                        <div
                          className="small text-muted"
                          style={{ fontSize: "0.75rem", marginTop: "2px" }}
                        >
                          from {t.requester.name}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        color: "#334155",
                        verticalAlign: "middle",
                        wordBreak: "break-word",
                        lineHeight: 1.35,
                      }}
                    >
                      {t.category?.name || "General"}
                    </td>
                    <td style={{ textAlign: "center", whiteSpace: "nowrap", verticalAlign: "middle" }}>
                      {renderPriorityBadge(t.requestedPriority, true)}
                    </td>
                    <td style={{ whiteSpace: "nowrap", verticalAlign: "middle" }}>
                      {t.itPriority ? (
                        renderPriorityBadge(t.itPriority, false)
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>
                    <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                      {renderStatusBadge(t.currentStatus)}
                    </td>
                    <td style={{ whiteSpace: "nowrap", verticalAlign: "middle" }}>
                      {t.ticketOwner ? (
                        <span
                          className="badge border d-inline-flex align-items-center gap-1"
                          style={{
                            fontWeight: 500,
                            fontSize: "0.8rem",
                            backgroundColor: "#F8FAFC",
                            color: "#334155",
                            borderColor: "#E2E8F0",
                            padding: "0.28rem 0.5rem",
                            borderRadius: 6,
                          }}
                          data-testid={`ticket-owner-${t.id}`}
                          title={t.ticketOwner.name}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#64748B"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ flexShrink: 0 }}
                            aria-hidden="true"
                          >
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          <span>{t.ticketOwner.name}</span>
                        </span>
                      ) : (
                        <span
                          className="badge border border-dashed d-inline-flex align-items-center gap-1 text-muted"
                          style={{
                            fontWeight: 400,
                            fontSize: "0.75rem",
                            backgroundColor: "transparent",
                            borderColor: "#CBD5E1",
                            padding: "0.25rem 0.5rem",
                            borderRadius: 6,
                          }}
                          data-testid={`ticket-owner-unassigned-${t.id}`}
                        >
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#94A3B8"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ flexShrink: 0 }}
                            aria-hidden="true"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                          </svg>
                          <span>Unassigned</span>
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "center", whiteSpace: "nowrap", verticalAlign: "middle", padding: "0.75rem 1rem" }}>
                      <button
                        type="button"
                        className="zen-btn-view"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTicketClick(t.id);
                        }}
                        data-testid={`view-ticket-${t.id}`}
                        title="View ticket detail"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Responsive Cards View (< 1200px: Mobile & Tablet) */}
          <div className="d-block d-xl-none p-3">
            <div className="row g-3">
              {tickets.map((t) => (
                <div key={t.id} className="col-12 col-md-6">
                  <div
                    className="card border shadow-sm h-100"
                    data-testid={`ticket-card-${t.id}`}
                    onClick={() => handleTicketClick(t.id)}
                    style={{
                      borderRadius: "var(--radius-card)",
                      cursor: "pointer",
                      transition: "box-shadow 0.15s ease",
                    }}
                  >
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold text-primary" style={{ fontSize: "0.9rem" }}>
                        {t.ticketNumber}
                      </span>
                      {renderStatusBadge(t.currentStatus)}
                    </div>

                    <h3 className="h6 fw-semibold text-dark mb-1" style={{ fontSize: "0.95rem" }}>
                      {t.summary}
                    </h3>

                    <div className="text-muted small mb-2 d-flex align-items-center gap-2" style={{ fontSize: "0.78rem" }}>
                      <span className="d-inline-flex align-items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                        </svg>
                        {t.category?.name || "General"}
                      </span>
                      <span>•</span>
                      <span className="d-inline-flex align-items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {formatDate(t.createdAt)}
                      </span>
                    </div>

                    {t.requester && (
                      <div className="small text-muted mb-3" style={{ fontSize: "0.75rem" }}>
                        Requester: <strong>{t.requester.name}</strong>
                      </div>
                    )}

                    <div className="d-flex flex-wrap justify-content-between align-items-center pt-2 border-top gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <div>
                          <span className="text-muted small me-1" style={{ fontSize: "0.72rem" }}>Req:</span>
                          {renderPriorityBadge(t.requestedPriority, true)}
                        </div>
                        <div>
                          <span className="text-muted small me-1" style={{ fontSize: "0.72rem" }}>IT:</span>
                          {t.itPriority ? (
                            renderPriorityBadge(t.itPriority, false)
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </div>
                      </div>

                      <div>
                        {t.ticketOwner ? (
                          <span
                            className="badge border d-inline-flex align-items-center gap-1"
                            style={{
                              fontSize: "0.75rem",
                              backgroundColor: "#F8FAFC",
                              color: "#334155",
                              borderColor: "#E2E8F0",
                            }}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span>{t.ticketOwner.name}</span>
                          </span>
                        ) : (
                          <span
                            className="badge border border-dashed d-inline-flex align-items-center gap-1 text-muted"
                            style={{ fontSize: "0.75rem", borderColor: "#CBD5E1" }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                            </svg>
                            <span>Unassigned</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>

          {/* Pagination Footer */}
          <div
            className="zen-pagination d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 p-3 border-top"
            style={{ backgroundColor: "#FAFCFA" }}
          >
            <div className="text-muted small" data-testid="pagination-info">
              Showing{" "}
              <strong>
                {tickets.length > 0 ? (pagination.page - 1) * pagination.pageSize + 1 : 0}
              </strong>{" "}
              to{" "}
              <strong>
                {Math.min(pagination.page * pagination.pageSize, pagination.totalRecords)}
              </strong>{" "}
              of <strong>{pagination.totalRecords}</strong> tickets
            </div>

            <div className="d-flex align-items-center gap-2">
              <select
                className="form-select form-select-sm"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                data-testid="page-size-select"
                style={{ width: "auto", fontSize: "0.8rem", borderRadius: "var(--radius-btn)" }}
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={pagination.page <= 1}
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
                disabled={pagination.page >= pagination.totalPages}
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
