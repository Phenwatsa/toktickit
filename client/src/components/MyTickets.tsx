import React, { useState, useEffect, useCallback } from "react";
import { useRequester } from "../context/RequesterContext";
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
    if (!currentRequester) return;

    setIsLoading(true);
    setError(null);
    try {
      const parts = sortOption.split("_");
      const sortBy = parts[0];
      const sortOrder = parts[1] as "asc" | "desc";

      const res = await fetchMyTickets({
        requesterId: currentRequester.id,
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
    currentRequester,
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
      RESOLVED: "zen-badge-resolved",
      CLOSED: "zen-badge-closed",
      CANCELLED: "zen-badge-cancelled",
    };
    const labelMap: Record<string, string> = {
      NEW: "New",
      OPEN: "Open",
      IN_PROGRESS: "In Progress",
      PENDING: "Pending",
      RESOLVED: "Resolved",
      CLOSED: "Closed",
      CANCELLED: "Cancelled",
    };
    return (
      <span
        className={`zen-badge ${classNameMap[s] || "zen-badge-new"}`}
        data-testid={`badge-status-${s.toLowerCase().replace("_", "-")}`}
      >
        {labelMap[s] || s}
      </span>
    );
  }

  return (
    <div style={{ paddingBottom: "3rem" }}>
      {/* Header & Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.35rem", fontWeight: 700, color: "var(--color-text-main)", letterSpacing: "-0.02em" }}>
            My Support Tickets
          </h1>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            Showing tickets submitted by <strong>{currentRequester?.name}</strong>
          </p>
        </div>

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

      {/* Filter and Search Bar Card */}
      <div className="zen-card" style={{ marginBottom: "1.25rem", padding: "0.85rem 1rem" }} data-testid="filter-bar">
        {/* Desktop Single-Row Filter Bar */}
        <div className="zen-filter-bar-desktop">
          {/* Search Input */}
          <div className="zen-search-wrapper">
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
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              data-testid="search-input"
            />
          </div>

          {/* Category Filter */}
          <select
            id="filterCategory"
            className="zen-filter-select"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value ? Number(e.target.value) : "");
              setCurrentPage(1);
            }}
            aria-label="Filter by Category"
            data-testid="category-filter"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            id="filterPriority"
            className="zen-filter-select"
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by Priority"
            data-testid="priority-filter"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          {/* Status Filter */}
          <select
            id="filterStatus"
            className="zen-filter-select"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by Status"
            data-testid="status-filter"
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

          {/* Sort Control */}
          <select
            id="filterSort"
            className="zen-filter-select"
            value={sortOption}
            onChange={(e) => {
              setSortOption(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Sort tickets"
            data-testid="sort-select"
          >
            <option value="createdAt_desc">Date (Newest)</option>
            <option value="createdAt_asc">Date (Oldest)</option>
            <option value="ticketNumber_asc">Ticket # (Asc)</option>
            <option value="ticketNumber_desc">Ticket # (Desc)</option>
            <option value="updatedAt_desc">Updated</option>
          </select>

          {/* Clear Filters Button */}
          <button
            type="button"
            className="zen-btn-clear-filters"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            data-testid="clear-filters-btn"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Clear Filters
          </button>
        </div>

        {/* Mobile Filter Bar: Compact Search + Filter Modal Button */}
        <div className="zen-filter-bar-mobile">
          <div className="zen-search-wrapper">
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
        <div className="zen-table-container" data-testid="tickets-table-card">
          <div className="zen-table-responsive">
            <table className="zen-table" data-testid="tickets-table">
              <thead>
                <tr>
                  <th style={{ width: "16%", whiteSpace: "nowrap" }}>Ticket No.</th>
                  <th style={{ width: "13%", whiteSpace: "nowrap" }}>Date Created</th>
                  <th style={{ width: "33%" }}>Summary</th>
                  <th style={{ width: "16%", whiteSpace: "nowrap" }}>Category</th>
                  <th style={{ width: "9%", whiteSpace: "nowrap" }}>Priority</th>
                  <th style={{ width: "8%", whiteSpace: "nowrap" }}>Status</th>
                  <th style={{ width: "5%", textAlign: "right", whiteSpace: "nowrap" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} data-testid={`ticket-row-${t.id}`}>
                    {/* Ticket Number */}
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span className="zen-ticket-number">
                        {t.ticketNumber}
                      </span>
                    </td>

                    {/* Date Created */}
                    <td style={{ fontSize: "0.8rem", color: "#64748B", whiteSpace: "nowrap" }}>
                      {formatDate(t.createdAt)}
                    </td>

                    {/* Summary */}
                    <td>
                      <div className="zen-ticket-summary" style={{ maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.summary}
                      </div>
                      <div className="zen-ticket-meta">
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
                    <td style={{ fontSize: "0.85rem", color: "#334155", whiteSpace: "nowrap" }}>
                      {t.category?.name || "General"}
                    </td>

                    {/* Requested Priority */}
                    <td>
                      {renderPriorityBadge(t.requestedPriority)}
                    </td>

                    {/* Current Status */}
                    <td>
                      {renderStatusBadge(t.currentStatus)}
                    </td>

                    {/* Action Button */}
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="zen-btn-view"
                        onClick={() => onSelectTicket && onSelectTicket(t.id)}
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
          <div className="zen-pagination">
            <div data-testid="pagination-info">
              Showing <strong>{tickets.length > 0 ? (pagination.page - 1) * pagination.pageSize + 1 : 0}</strong> to{" "}
              <strong>{Math.min(pagination.page * pagination.pageSize, pagination.totalItems)}</strong> of{" "}
              <strong>{pagination.totalItems}</strong> tickets
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                type="button"
                className="zen-btn-secondary"
                disabled={!pagination.hasPrevPage}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                data-testid="pagination-prev-btn"
                style={{ fontSize: "0.8rem", padding: "0.25rem 0.65rem" }}
              >
                Previous
              </button>
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155" }}>
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>
              <button
                type="button"
                className="zen-btn-secondary"
                disabled={!pagination.hasNextPage}
                onClick={() => setCurrentPage((p) => p + 1)}
                data-testid="pagination-next-btn"
                style={{ fontSize: "0.8rem", padding: "0.25rem 0.65rem" }}
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
