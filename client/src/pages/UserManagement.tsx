import React, { useState, useEffect, useCallback } from "react";
import {
  AdminUser,
  Role,
  CreateUserPayload,
  UpdateUserPayload,
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetAdminUserPassword,
} from "../api";
import { useAuth } from "../context/AuthContext";

export function UserManagement() {
  const { user: currentUser } = useAuth();

  // User List State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [createName, setCreateName] = useState<string>("");
  const [createEmail, setCreateEmail] = useState<string>("");
  const [createDepartment, setCreateDepartment] = useState<string>("");
  const [createRole, setCreateRole] = useState<Role>("REQUESTER");
  const [createPassword, setCreatePassword] = useState<string>("");
  const [createIsActive, setCreateIsActive] = useState<boolean>(true);
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showCreatePassword, setShowCreatePassword] = useState<boolean>(false);
  const [createFieldErrors, setCreateFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editEmail, setEditEmail] = useState<string>("");
  const [editDepartment, setEditDepartment] = useState<string>("");
  const [editRole, setEditRole] = useState<Role>("REQUESTER");
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<{
    name?: string;
    email?: string;
  }>({});

  // Reset Password State (Inside Edit Modal)
  const [resetPasswordInput, setResetPasswordInput] = useState<string>("");
  const [resetLoading, setResetLoading] = useState<boolean>(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [showResetPassword, setShowResetPassword] = useState<boolean>(false);
  const [resetFieldError, setResetFieldError] = useState<string | null>(null);

  // Password Policy Checks for Create Modal
  const isCreateMinLength = createPassword.length >= 8;
  const isCreateHasUpper = /[A-Z]/.test(createPassword);
  const isCreateHasLower = /[a-z]/.test(createPassword);
  const isCreateHasNumber = /[0-9]/.test(createPassword);

  // Password Policy Checks for Reset Password
  const isResetMinLength = resetPasswordInput.length >= 8;
  const isResetHasUpper = /[A-Z]/.test(resetPasswordInput);
  const isResetHasLower = /[a-z]/.test(resetPasswordInput);
  const isResetHasNumber = /[0-9]/.test(resetPasswordInput);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await fetchAdminUsers({
        search: search.trim() ? search : undefined,
        role: roleFilter !== "ALL" ? roleFilter : undefined,
      });
      setUsers(data);
    } catch (err: any) {
      setFetchError(err.message || "Failed to load user accounts.");
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Open Edit Modal with selected user
  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditDepartment(user.department || "");
    setEditRole(user.role);
    setEditIsActive(user.isActive);
    setEditError(null);
    setEditSuccess(null);
    setEditFieldErrors({});
    setResetPasswordInput("");
    setResetError(null);
    setResetSuccess(null);
    setResetFieldError(null);
    setShowResetPassword(false);
  };

  const handleCloseEdit = () => {
    setEditingUser(null);
    setEditError(null);
    setEditSuccess(null);
    setEditFieldErrors({});
    setResetError(null);
    setResetSuccess(null);
    setResetFieldError(null);
    setShowResetPassword(false);
  };

  const handleOpenCreate = () => {
    setCreateName("");
    setCreateEmail("");
    setCreateDepartment("");
    setCreateRole("REQUESTER");
    setCreatePassword("");
    setCreateIsActive(true);
    setCreateError(null);
    setCreateFieldErrors({});
    setShowCreatePassword(false);
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    setCreateError(null);
    setCreateFieldErrors({});
    setShowCreatePassword(false);
  };

  // Submit Create User
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const errors: { name?: string; email?: string; password?: string } = {};

    if (!createName.trim()) {
      errors.name = "Full name is required.";
    }

    if (!createEmail.trim()) {
      errors.email = "Email address is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(createEmail.trim())) {
        errors.email = "Please enter a valid email address.";
      }
    }

    if (!createPassword) {
      errors.password = "Initial password is required.";
    } else if (!isCreateMinLength || !isCreateHasUpper || !isCreateHasLower || !isCreateHasNumber) {
      errors.password = "Password does not meet the security requirements below.";
    }

    if (Object.keys(errors).length > 0) {
      setCreateFieldErrors(errors);
      setCreateError("Please correct the highlighted errors before submitting.");
      return;
    }

    setCreateFieldErrors({});
    setCreateLoading(true);
    try {
      const payload: CreateUserPayload = {
        name: createName.trim(),
        email: createEmail.trim(),
        department: createDepartment.trim() || undefined,
        role: createRole,
        initialPassword: createPassword,
        isActive: createIsActive,
      };
      await createAdminUser(payload);
      handleCloseCreate();
      await loadUsers();
    } catch (err: any) {
      const errMsg = err.message || "Failed to create user.";
      setCreateError(errMsg);
      if (err.code === "DUPLICATE_EMAIL" || errMsg.toLowerCase().includes("already exists")) {
        setCreateFieldErrors({ email: "A user with this email address already exists." });
      } else if (err.code === "VALIDATION_ERROR" || errMsg.toLowerCase().includes("password")) {
        setCreateFieldErrors({ password: errMsg });
      }
    } finally {
      setCreateLoading(false);
    }
  };

  // Submit Edit User
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);
    setEditSuccess(null);

    const errors: { name?: string; email?: string } = {};
    if (!editName.trim()) {
      errors.name = "Full name cannot be empty.";
    }
    if (!editEmail.trim()) {
      errors.email = "Email address cannot be empty.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editEmail.trim())) {
        errors.email = "Please enter a valid email address.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setEditFieldErrors(errors);
      setEditError("Please correct the highlighted errors.");
      return;
    }

    setEditFieldErrors({});
    setEditLoading(true);
    try {
      const payload: UpdateUserPayload = {
        name: editName.trim(),
        email: editEmail.trim(),
        department: editDepartment.trim() ? editDepartment.trim() : null,
        role: editRole,
        isActive: editIsActive,
      };

      const updated = await updateAdminUser(editingUser.id, payload);
      setEditingUser(updated);
      setEditSuccess("User details saved successfully.");
      await loadUsers();
    } catch (err: any) {
      const errMsg = err.message || "Failed to update user.";
      setEditError(errMsg);
      if (err.code === "DUPLICATE_EMAIL" || errMsg.toLowerCase().includes("already exists")) {
        setEditFieldErrors({ email: "A user with this email address already exists." });
      }
    } finally {
      setEditLoading(false);
    }
  };

  // Submit Reset Password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setResetError(null);
    setResetSuccess(null);
    setResetFieldError(null);

    if (!resetPasswordInput) {
      setResetFieldError("New initial password is required.");
      setResetError("New initial password is required.");
      return;
    }

    if (!isResetMinLength || !isResetHasUpper || !isResetHasLower || !isResetHasNumber) {
      setResetFieldError("Password does not meet the requirements below.");
      setResetError("Password does not meet complexity requirements.");
      return;
    }

    setResetLoading(true);
    try {
      const res = await resetAdminUserPassword(editingUser.id, resetPasswordInput);
      setResetSuccess(res.message || "Initial password reset successfully. User must change password at next login.");
      setResetPasswordInput("");
    } catch (err: any) {
      const errMsg = err.message || "Failed to reset password.";
      setResetError(errMsg);
      setResetFieldError(errMsg);
    } finally {
      setResetLoading(false);
    }
  };

  const isCurrentAdmin = editingUser && currentUser && editingUser.id === currentUser.id;

  const renderRoleBadge = (role: Role) => {
    switch (role) {
      case "ADMINISTRATOR":
        return (
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0.22rem 0.65rem",
              borderRadius: "9999px",
              backgroundColor: "var(--zg-role-admin-bg, #EDE9FE)",
              color: "var(--zg-role-admin-text, #6D28D9)",
              border: "1px solid #C4B5FD",
              letterSpacing: "0.02em",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              whiteSpace: "nowrap",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Administrator
          </span>
        );
      case "IT_STAFF":
        return (
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0.22rem 0.65rem",
              borderRadius: "9999px",
              backgroundColor: "var(--zg-role-staff-bg, #E0F2FE)",
              color: "var(--zg-role-staff-text, #0369A1)",
              border: "1px solid #7DD3FC",
              letterSpacing: "0.02em",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              whiteSpace: "nowrap",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            IT Staff
          </span>
        );
      case "REQUESTER":
      default:
        return (
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0.22rem 0.65rem",
              borderRadius: "9999px",
              backgroundColor: "#F1F5F9",
              color: "#334155",
              border: "1px solid #CBD5E1",
              letterSpacing: "0.02em",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              whiteSpace: "nowrap",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Requester
          </span>
        );
    }
  };

  const renderStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            padding: "0.22rem 0.65rem",
            borderRadius: "9999px",
            backgroundColor: "#DCFCE7",
            color: "#15803D",
            border: "1px solid #86EFAC",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#16A34A",
            }}
          />
          Active
        </span>
      );
    }
    return (
      <span
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          padding: "0.22rem 0.65rem",
          borderRadius: "9999px",
          backgroundColor: "#F1F5F9",
          color: "#64748B",
          border: "1px solid #CBD5E1",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: "#94A3B8",
          }}
        />
        Inactive
      </span>
    );
  };

  const renderPasswordRuleItem = (isPassed: boolean, label: string) => (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.45rem",
        marginBottom: "0.3rem",
        color: isPassed ? "#15803D" : "#64748B",
        fontSize: "0.8rem",
        fontWeight: isPassed ? 600 : 400,
      }}
    >
      {isPassed ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
        </svg>
      )}
      <span>{label}</span>
    </li>
  );

  return (
    <div className="zen-container py-3" data-testid="admin-user-management">
      {/* Page Header matching IT Staff format */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: "var(--color-pale-green, #EAF6EF)",
                color: "var(--color-primary, #006B3C)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            User Management
          </h1>
          <p className="text-muted small mb-0">
            Create, view, and administer user accounts, roles, and access credentials.
          </p>
        </div>

        <button
          type="button"
          className="zen-btn-primary d-inline-flex align-items-center gap-2"
          onClick={handleOpenCreate}
          data-testid="create-user-button"
          style={{
            backgroundColor: "var(--color-primary, #006B3C)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            padding: "0.5rem 1.1rem",
            fontWeight: 600,
            fontSize: "0.875rem",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0, 107, 60, 0.2)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Create New User</span>
        </button>
      </div>

      {/* Global Fetch Error Banner */}
      {fetchError && (
        <div
          className="alert alert-danger d-flex align-items-center gap-2 mb-4 shadow-sm"
          data-testid="admin-users-error"
          role="alert"
          style={{ borderRadius: "8px" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>{fetchError}</div>
        </div>
      )}

      {/* Filter and Search Bar matching Staff Queue layout */}
      <div className="zen-card mb-4 p-3 shadow-sm" style={{ backgroundColor: "#FFFFFF", borderRadius: "10px" }}>
        <div className="d-flex flex-column flex-md-row align-items-md-center gap-3">
          {/* Search Box with Left SVG Icon and Right Clear Button */}
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="admin-search-input"
              style={{
                borderRadius: "8px",
                borderColor: "#E2E8F0",
                backgroundColor: "#F8FAFC",
                paddingLeft: "2.2rem",
                paddingRight: search ? "2rem" : "0.75rem",
                fontSize: "0.85rem",
                height: "38px",
                width: "100%",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-muted, #64748B)",
                pointerEvents: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  color: "var(--color-text-muted, #64748B)",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  padding: 0,
                }}
                title="Clear search"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Role Filter Select */}
          <div style={{ minWidth: 200 }}>
            <select
              id="admin-role-filter"
              className="form-select form-select-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              data-testid="admin-role-filter"
              style={{
                borderRadius: "8px",
                borderColor: "#E2E8F0",
                backgroundColor: "#F8FAFC",
                fontSize: "0.85rem",
                fontWeight: 500,
                height: "38px",
                width: "100%",
                color: "#334155",
              }}
            >
              <option value="ALL">All Roles</option>
              <option value="REQUESTER">Requester</option>
              <option value="IT_STAFF">IT Staff</option>
              <option value="ADMINISTRATOR">Administrator</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table matching zen-table-container format */}
      <div
        className="zen-card p-0 overflow-hidden shadow-sm"
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "10px",
          border: "1px solid var(--color-border, #E2E8F0)",
        }}
      >
        {isLoading ? (
          <div className="text-center py-5" data-testid="loading-indicator">
            <div className="spinner-border text-success mb-2" role="status">
              <span className="visually-hidden">Loading users…</span>
            </div>
            <p className="text-muted small mb-0">Loading accounts…</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-5 text-muted" data-testid="empty-users">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="mb-0 fw-semibold text-dark">No users found</p>
            <small className="text-muted">Try adjusting your search criteria or role filter.</small>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="zen-table mb-0 w-100" data-testid="users-table">
              <thead>
                <tr>
                  <th style={{ backgroundColor: "#F8FAFC", boxShadow: "0 1px 0 var(--color-border)" }}>Name</th>
                  <th style={{ backgroundColor: "#F8FAFC", boxShadow: "0 1px 0 var(--color-border)" }}>Email</th>
                  <th style={{ backgroundColor: "#F8FAFC", boxShadow: "0 1px 0 var(--color-border)" }}>Department</th>
                  <th style={{ backgroundColor: "#F8FAFC", boxShadow: "0 1px 0 var(--color-border)" }}>Role</th>
                  <th style={{ backgroundColor: "#F8FAFC", boxShadow: "0 1px 0 var(--color-border)" }}>Status</th>
                  <th style={{ backgroundColor: "#F8FAFC", boxShadow: "0 1px 0 var(--color-border)", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <tr
                      key={u.id}
                      data-testid={`user-row-${u.id}`}
                      style={{
                        backgroundColor: isCurrent ? "rgba(0, 107, 60, 0.03)" : "transparent",
                      }}
                    >
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-semibold text-slate-800" data-testid={`user-name-${u.id}`}>
                            {u.name}
                          </span>
                          {isCurrent && (
                            <span
                              className="badge bg-light text-secondary border"
                              style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem", borderRadius: "9999px" }}
                            >
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-muted" data-testid={`user-email-${u.id}`}>
                        {u.email}
                      </td>
                      <td className="text-muted" data-testid={`user-dept-${u.id}`}>
                        {u.department || "—"}
                      </td>
                      <td data-testid={`user-role-${u.id}`}>
                        {renderRoleBadge(u.role)}
                      </td>
                      <td data-testid={`user-status-${u.id}`}>
                        {renderStatusBadge(u.isActive)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                          onClick={() => handleOpenEdit(u)}
                          data-testid={`edit-user-btn-${u.id}`}
                          style={{
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            padding: "0.25rem 0.65rem",
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* Create User Modal */}
      {/* ========================================================================= */}
      {isCreateOpen && (
        <div
          className="modal d-block"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.5)", zIndex: 1050 }}
          data-testid="create-user-modal"
        >
          <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: 520 }}>
            <div className="modal-content shadow-lg" style={{ borderRadius: "12px", border: "1px solid #E2E8F0" }}>
              <div className="modal-header border-bottom px-4 py-3">
                <h5 className="modal-title h6 fw-bold d-flex align-items-center gap-2 mb-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#006B3C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create New User
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={handleCloseCreate}
                  disabled={createLoading}
                />
              </div>

              <form onSubmit={handleCreateSubmit} noValidate>
                <div className="modal-body px-4 py-3">
                  {/* Top Alert Banner */}
                  {createError && (
                    <div
                      className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3"
                      data-testid="create-user-error"
                      role="alert"
                      style={{ borderRadius: "8px" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <div>{createError}</div>
                    </div>
                  )}

                  {/* Name Input */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={createName}
                      onChange={(e) => {
                        setCreateName(e.target.value);
                        if (createFieldErrors.name) {
                          setCreateFieldErrors((prev) => ({ ...prev, name: undefined }));
                        }
                      }}
                      placeholder="e.g. Alice Walker"
                      data-testid="create-user-name"
                      style={{
                        borderColor: createFieldErrors.name ? "#DC2626" : "#CBD5E1",
                        backgroundColor: createFieldErrors.name ? "#FEF2F2" : "#FFFFFF",
                      }}
                      required
                    />
                    {createFieldErrors.name && (
                      <div className="text-danger small mt-1" style={{ fontSize: "0.78rem" }}>
                        {createFieldErrors.name}
                      </div>
                    )}
                  </div>

                  {/* Email Input */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      value={createEmail}
                      onChange={(e) => {
                        setCreateEmail(e.target.value);
                        if (createFieldErrors.email) {
                          setCreateFieldErrors((prev) => ({ ...prev, email: undefined }));
                        }
                      }}
                      placeholder="e.g. alice@toktickit.com"
                      data-testid="create-user-email"
                      style={{
                        borderColor: createFieldErrors.email ? "#DC2626" : "#CBD5E1",
                        backgroundColor: createFieldErrors.email ? "#FEF2F2" : "#FFFFFF",
                      }}
                      required
                    />
                    {createFieldErrors.email && (
                      <div className="text-danger small mt-1" style={{ fontSize: "0.78rem" }}>
                        {createFieldErrors.email}
                      </div>
                    )}
                  </div>

                  {/* Department */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Department (Optional)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={createDepartment}
                      onChange={(e) => setCreateDepartment(e.target.value)}
                      placeholder="e.g. Marketing, Sales, Engineering"
                      data-testid="create-user-department"
                    />
                  </div>

                  {/* Role Selection */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Role <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={createRole}
                      onChange={(e) => setCreateRole(e.target.value as Role)}
                      data-testid="create-user-role"
                      required
                    >
                      <option value="REQUESTER">Requester</option>
                      <option value="IT_STAFF">IT Staff</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                    </select>
                  </div>

                  {/* Initial Password with Eye Toggle & Live Checklist */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label small fw-semibold text-secondary mb-0">
                        Initial Password <span className="text-danger">*</span>
                      </label>
                      <span className="text-muted" style={{ fontSize: "0.72rem" }}>
                        (User will be required to change this upon first login)
                      </span>
                    </div>

                    <div style={{ position: "relative" }}>
                      <input
                        type={showCreatePassword ? "text" : "password"}
                        className="form-control"
                        value={createPassword}
                        onChange={(e) => {
                          setCreatePassword(e.target.value);
                          if (createFieldErrors.password) {
                            setCreateFieldErrors((prev) => ({ ...prev, password: undefined }));
                          }
                        }}
                        placeholder="Enter temporary password"
                        data-testid="create-user-password"
                        style={{
                          paddingRight: "2.5rem",
                          borderColor: createFieldErrors.password ? "#DC2626" : "#CBD5E1",
                          backgroundColor: createFieldErrors.password ? "#FEF2F2" : "#FFFFFF",
                        }}
                        required
                      />
                      <button
                        type="button"
                        aria-label={showCreatePassword ? "Hide password" : "Show password"}
                        onClick={() => setShowCreatePassword(!showCreatePassword)}
                        tabIndex={-1}
                        style={{
                          position: "absolute",
                          right: "8px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          color: "var(--color-text-muted, #64748B)",
                          cursor: "pointer",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {showCreatePassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {createFieldErrors.password && (
                      <div className="text-danger small mt-1" style={{ fontSize: "0.78rem" }}>
                        {createFieldErrors.password}
                      </div>
                    )}

                    {/* Clear Password Policy Requirements Checklist */}
                    <div
                      className="p-3 mt-2 rounded border"
                      style={{
                        backgroundColor: "#F8FAFC",
                        borderColor: "#E2E8F0",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          color: "#64748B",
                          marginBottom: "0.45rem",
                        }}
                      >
                        Password Requirements:
                      </span>
                      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                        {renderPasswordRuleItem(isCreateMinLength, "At least 8 characters")}
                        {renderPasswordRuleItem(isCreateHasUpper, "At least one uppercase letter (A-Z)")}
                        {renderPasswordRuleItem(isCreateHasLower, "At least one lowercase letter (a-z)")}
                        {renderPasswordRuleItem(isCreateHasNumber, "At least one number (0-9)")}
                      </ul>
                    </div>
                  </div>

                  {/* Account Active Switch */}
                  <div className="form-check form-switch mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="createIsActiveSwitch"
                      checked={createIsActive}
                      onChange={(e) => setCreateIsActive(e.target.checked)}
                      data-testid="create-user-active-toggle"
                    />
                    <label className="form-check-label small fw-medium" htmlFor="createIsActiveSwitch">
                      Account Active upon creation
                    </label>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={handleCloseCreate}
                    disabled={createLoading}
                    data-testid="create-user-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-success px-3"
                    disabled={createLoading}
                    data-testid="create-user-submit"
                    style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                  >
                    {createLoading ? "Creating…" : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Edit User Modal */}
      {/* ========================================================================= */}
      {editingUser && (
        <div
          className="modal d-block"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.5)", zIndex: 1050 }}
          data-testid="edit-user-modal"
        >
          <div className="modal-dialog modal-dialog-centered" role="document" style={{ maxWidth: 560 }}>
            <div className="modal-content shadow-lg" style={{ borderRadius: "12px", border: "1px solid #E2E8F0" }}>
              <div className="modal-header border-bottom px-4 py-3">
                <h5 className="modal-title h6 fw-bold d-flex align-items-center gap-2 mb-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#006B3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit User: {editingUser.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={handleCloseEdit}
                  disabled={editLoading || resetLoading}
                />
              </div>

              <div className="modal-body px-4 py-3">
                {editError && (
                  <div
                    className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3"
                    data-testid="edit-user-error"
                    role="alert"
                    style={{ borderRadius: "8px" }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <div>{editError}</div>
                  </div>
                )}

                {editSuccess && (
                  <div
                    className="alert alert-success py-2 px-3 small d-flex align-items-center gap-2 mb-3"
                    data-testid="edit-user-success"
                    role="alert"
                    style={{ borderRadius: "8px" }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <div>{editSuccess}</div>
                  </div>
                )}

                {/* Profile Details Form */}
                <form onSubmit={handleEditSubmit} noValidate>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editName}
                      onChange={(e) => {
                        setEditName(e.target.value);
                        if (editFieldErrors.name) {
                          setEditFieldErrors((prev) => ({ ...prev, name: undefined }));
                        }
                      }}
                      data-testid="edit-user-name"
                      style={{
                        borderColor: editFieldErrors.name ? "#DC2626" : "#CBD5E1",
                        backgroundColor: editFieldErrors.name ? "#FEF2F2" : "#FFFFFF",
                      }}
                      required
                    />
                    {editFieldErrors.name && (
                      <div className="text-danger small mt-1" style={{ fontSize: "0.78rem" }}>
                        {editFieldErrors.name}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      value={editEmail}
                      onChange={(e) => {
                        setEditEmail(e.target.value);
                        if (editFieldErrors.email) {
                          setEditFieldErrors((prev) => ({ ...prev, email: undefined }));
                        }
                      }}
                      data-testid="edit-user-email"
                      style={{
                        borderColor: editFieldErrors.email ? "#DC2626" : "#CBD5E1",
                        backgroundColor: editFieldErrors.email ? "#FEF2F2" : "#FFFFFF",
                      }}
                      required
                    />
                    {editFieldErrors.email && (
                      <div className="text-danger small mt-1" style={{ fontSize: "0.78rem" }}>
                        {editFieldErrors.email}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Department
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      placeholder="e.g. Finance, Support"
                      data-testid="edit-user-department"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Role <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as Role)}
                      data-testid="edit-user-role"
                      required
                    >
                      <option value="REQUESTER">Requester</option>
                      <option value="IT_STAFF">IT Staff</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                    </select>
                  </div>

                  {/* Active Status Switch with Self-Deactivation Guard */}
                  <div className="mb-4 p-3 bg-light rounded border">
                    <div className="form-check form-switch mb-1">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="editIsActiveSwitch"
                        checked={editIsActive}
                        onChange={(e) => setEditIsActive(e.target.checked)}
                        disabled={Boolean(isCurrentAdmin)}
                        data-testid="edit-user-active-toggle"
                      />
                      <label className="form-check-label fw-semibold small" htmlFor="editIsActiveSwitch">
                        Active Account
                      </label>
                    </div>
                    {isCurrentAdmin && (
                      <p
                        className="text-muted small mb-0 mt-1 d-flex align-items-center gap-1"
                        data-testid="self-deactivation-notice"
                        style={{ fontSize: "0.75rem", color: "#D97706" }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        You cannot deactivate your own administrator account.
                      </p>
                    )}
                  </div>

                  <div className="d-flex justify-content-end mb-4">
                    <button
                      type="submit"
                      className="btn btn-sm btn-success px-3"
                      disabled={editLoading}
                      data-testid="edit-user-save"
                      style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                    >
                      {editLoading ? "Saving…" : "Save Details"}
                    </button>
                  </div>
                </form>

                <hr className="my-4" />

                {/* Reset Initial Password Section */}
                <div data-testid="reset-password-section">
                  <h6 className="fw-bold small text-slate-800 d-flex align-items-center gap-2 mb-2">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#006B3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Reset Initial Password
                  </h6>
                  <p className="text-muted small mb-3" style={{ fontSize: "0.8rem" }}>
                    Sets a temporary initial password. The user will be required to change their password at their next login, and any active sessions will be invalidated.
                  </p>

                  {resetError && (
                    <div
                      className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3"
                      data-testid="reset-password-error"
                      role="alert"
                      style={{ borderRadius: "8px" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <div>{resetError}</div>
                    </div>
                  )}

                  {resetSuccess && (
                    <div
                      className="alert alert-success py-2 px-3 small d-flex align-items-center gap-2 mb-3"
                      data-testid="reset-password-success"
                      role="alert"
                      style={{ borderRadius: "8px" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <div>{resetSuccess}</div>
                    </div>
                  )}

                  <form onSubmit={handleResetPasswordSubmit}>
                    <div className="d-flex gap-2">
                      <div style={{ position: "relative", flex: 1 }}>
                        <input
                          type={showResetPassword ? "text" : "password"}
                          className="form-control form-control-sm"
                          placeholder="New initial password (8+ chars)"
                          value={resetPasswordInput}
                          onChange={(e) => {
                            setResetPasswordInput(e.target.value);
                            if (resetFieldError) setResetFieldError(null);
                          }}
                          data-testid="reset-password-input"
                          style={{
                            paddingRight: "2.5rem",
                            borderColor: resetFieldError ? "#DC2626" : "#CBD5E1",
                            backgroundColor: resetFieldError ? "#FEF2F2" : "#FFFFFF",
                          }}
                        />
                        <button
                          type="button"
                          aria-label={showResetPassword ? "Hide password" : "Show password"}
                          onClick={() => setShowResetPassword(!showResetPassword)}
                          tabIndex={-1}
                          style={{
                            position: "absolute",
                            right: "8px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            color: "var(--color-text-muted, #64748B)",
                            cursor: "pointer",
                            padding: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {showResetPassword ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-sm btn-outline-danger text-nowrap"
                        disabled={resetLoading}
                        data-testid="reset-password-button"
                      >
                        {resetLoading ? "Resetting…" : "Reset Password"}
                      </button>
                    </div>

                    {resetFieldError && (
                      <div className="text-danger small mt-1" style={{ fontSize: "0.78rem" }}>
                        {resetFieldError}
                      </div>
                    )}

                    {/* Reset Password Requirements Checklist */}
                    <div
                      className="p-3 mt-2 rounded border"
                      style={{
                        backgroundColor: "#F8FAFC",
                        borderColor: "#E2E8F0",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          color: "#64748B",
                          marginBottom: "0.45rem",
                        }}
                      >
                        Password Requirements:
                      </span>
                      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                        {renderPasswordRuleItem(isResetMinLength, "At least 8 characters")}
                        {renderPasswordRuleItem(isResetHasUpper, "At least one uppercase letter (A-Z)")}
                        {renderPasswordRuleItem(isResetHasLower, "At least one lowercase letter (a-z)")}
                        {renderPasswordRuleItem(isResetHasNumber, "At least one number (0-9)")}
                      </ul>
                    </div>
                  </form>
                </div>
              </div>

              <div className="modal-footer border-top px-4 py-3">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleCloseEdit}
                  disabled={editLoading || resetLoading}
                  data-testid="edit-user-cancel"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
