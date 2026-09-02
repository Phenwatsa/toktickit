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
        console.error("Failed to load categories:", err);
      }
    }
    loadCategories();
  }, []);

  // Fetch Tickets with AbortController for race condition protection
  const loadTickets = useCallback(() => {
    if (!currentRequester) return () => {};

    const requesterId = currentRequester.id;
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    async function executeFetch() {
      try {
        const [sortByField, sortOrderField] = sortOption.split("_");
        const response = await fetchMyTickets({
          requesterId,
          search: debouncedSearch.trim() || undefined,
          categoryId: categoryId !== "" ? Number(categoryId) : undefined,
          priority: priority !== "ALL" ? priority : undefined,
          status: status !== "ALL" ? status : undefined,
          page: currentPage,
          pageSize: 10,
          sortBy: sortByField,
          sortOrder: sortOrderField as "asc" | "desc",
          signal: controller.signal,
        });

        setTickets(response.data);
        setPagination(response.pagination);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // Ignore aborted requests
        }
        setError(
          err instanceof Error ? err.message : "Failed to load tickets from server."
        );
      } finally {
        setIsLoading(false);
      }
    }

    executeFetch();

    return () => {
      controller.abort();
    };
  }, [currentRequester, debouncedSearch, categoryId, priority, status, sortOption, currentPage]);

  useEffect(() => {
    const cleanup = loadTickets();
    return cleanup;
  }, [loadTickets]);

  // Reset all filters
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
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  }

  function renderPriorityBadge(p: string) {
    const pLower = p.toLowerCase();
    return (
      <span className={`zen-badge zen-badge-priority-${pLower}`} data-testid={`badge-priority-${pLower}`}>
        {p}
      </span>
    );
  }

  function renderStatusBadge(s: string) {
    const sLower = s.toLowerCase().replace("_", "-");
    return (
      <span className={`zen-badge zen-badge-${sLower}`} data-testid={`badge-status-${sLower}`}>
        {s.replace("_", " ")}
      </span>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Top Header Card */}
      <div className="zen-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 0.25rem 0" }}>
            My Support Tickets
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: 0 }}>
            Viewing tickets submitted by{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>{currentRequester ? currentRequester.name : "..."}</strong>{" "}
            ({currentRequester ? currentRequester.department : "..."})
          </p>
        </div>
        <button
          type="button"
          className="zen-btn-primary"
          onClick={onNavigateToCreate}
          data-testid="create-ticket-cta"
        >
          ➕ Create Ticket
        </button>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="zen-card" style={{ padding: "1rem 1.25rem" }}>
        <div className="zen-filter-bar">
          {/* Inline Search Input */}
          <div className="zen-search-wrapper">
            <span className="zen-search-icon">🔍</span>
            <input
              id="searchTickets"
              type="text"
              className="zen-search-input"
              placeholder="Search ticket # or summary..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
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
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
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

          {/* Sort By Control */}
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
            <option value="createdAt_desc">Date (Newest First)</option>
            <option value="createdAt_asc">Date (Oldest First)</option>
            <option value="ticketNumber_asc">Ticket # (Ascending)</option>
            <option value="ticketNumber_desc">Ticket # (Descending)</option>
            <option value="updatedAt_desc">Recently Updated</option>
          </select>

          {/* Reset / Clear Button */}
          <button
            type="button"
            className="zen-btn-secondary"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            data-testid="clear-filters-btn"
            style={{ padding: "0.45rem 0.85rem" }}
          >
            ✕ Clear Filters
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ padding: "0.75rem 1rem", backgroundColor: "var(--color-error-bg)", border: "1px solid #FECACA", borderRadius: "6px", color: "var(--color-error)", fontSize: "0.875rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>⚠️ <strong>Error:</strong> {error}</span>
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

      {/* Main Content Area */}
      {isLoading ? (
        <div className="zen-card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", margin: 0 }}>
            ⏳ Loading your tickets...
          </p>
        </div>
      ) : tickets.length === 0 ? (
        // Empty State vs No-Results State
        hasActiveFilters ? (
          /* No-Results State (Search / Filter yielded 0 results) */
          <div className="zen-empty-state" data-testid="no-results-state">
            <div className="zen-empty-icon">🔍</div>
            <h3 className="zen-empty-title">No matching tickets found</h3>
            <p className="zen-empty-desc">
              No tickets matched your search query or filter criteria. Try adjusting your search keywords or clearing applied filters.
            </p>
            <button
              type="button"
              className="zen-btn-primary"
              onClick={handleClearFilters}
              data-testid="no-results-clear-btn"
            >
              ✕ Clear All Filters
            </button>
          </div>
        ) : (
          /* Empty State (User has 0 tickets) */
          <div className="zen-empty-state" data-testid="empty-state">
            <div className="zen-empty-icon">📭</div>
            <h3 className="zen-empty-title">You haven't submitted any tickets yet</h3>
            <p className="zen-empty-desc">
              Need assistance with hardware, software, VPN, or account access? Submit a new ticket to get help from the IT team.
            </p>
            <button
              type="button"
              className="zen-btn-primary"
              onClick={onNavigateToCreate}
              data-testid="empty-state-create-btn"
            >
              ➕ Create Your First Ticket
            </button>
          </div>
        )
      ) : (
        /* Populated Table View */
        <div className="zen-table-container" data-testid="tickets-table-card">
          <div className="zen-table-responsive">
            <table className="zen-table">
              <thead>
                <tr>
                  <th style={{ width: "17%", whiteSpace: "nowrap" }}>Ticket No.</th>
                  <th style={{ width: "17%", whiteSpace: "nowrap" }}>Date Created</th>
                  <th style={{ width: "27%" }}>Summary</th>
                  <th style={{ width: "15%", whiteSpace: "nowrap" }}>Category</th>
                  <th style={{ width: "10%", whiteSpace: "nowrap" }}>Priority</th>
                  <th style={{ width: "8%", whiteSpace: "nowrap" }}>Status</th>
                  <th style={{ width: "6%", textAlign: "right", whiteSpace: "nowrap" }}>Action</th>
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
                      <div className="zen-ticket-summary" style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.summary}
                      </div>
                      <div className="zen-ticket-meta">
                        <span>System: {t.relatedSystem?.name || "General"}</span>
                        {t.attachmentsCount !== undefined && t.attachmentsCount > 0 && (
                          <span style={{ backgroundColor: "#F1F5F9", padding: "1px 5px", borderRadius: "4px", fontSize: "0.75rem" }}>
                            📎 {t.attachmentsCount}
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

          {/* Pagination Controls Footer */}
          <div className="zen-pagination">
            <div data-testid="pagination-info">
              Showing{" "}
              <strong>
                {pagination.totalItems === 0
                  ? 0
                  : (pagination.page - 1) * pagination.pageSize + 1}
              </strong>{" "}
              to{" "}
              <strong>
                {Math.min(
                  pagination.page * pagination.pageSize,
                  pagination.totalItems
                )}
              </strong>{" "}
              of <strong>{pagination.totalItems}</strong> tickets
            </div>

            {pagination.totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="zen-btn-secondary"
                  style={{ fontSize: "0.775rem", padding: "0.25rem 0.6rem" }}
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  data-testid="pagination-prev-btn"
                >
                  « Previous
                </button>

                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155" }}>
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  type="button"
                  className="zen-btn-secondary"
                  style={{ fontSize: "0.775rem", padding: "0.25rem 0.6rem" }}
                  disabled={!pagination.hasNextPage}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  data-testid="pagination-next-btn"
                >
                  Next »
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
