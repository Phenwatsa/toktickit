import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserManagement } from "../../src/pages/UserManagement";
import * as api from "../../src/api";
import * as AuthContextModule from "../../src/context/AuthContext";
import { AdminUser } from "../../src/types";

// Mock API module
vi.mock("../../src/api", () => ({
  fetchAdminUsers: vi.fn(),
  createAdminUser: vi.fn(),
  updateAdminUser: vi.fn(),
  resetAdminUserPassword: vi.fn(),
}));

const mockCurrentAdmin = {
  id: 1,
  name: "System Admin",
  email: "admin@toktickit.com",
  role: "ADMINISTRATOR" as const,
  department: "IT Infrastructure",
  mustChangePassword: false,
  isActive: true,
};

const mockUsers: AdminUser[] = [
  {
    id: 1,
    name: "System Admin",
    email: "admin@toktickit.com",
    department: "IT Infrastructure",
    role: "ADMINISTRATOR",
    isActive: true,
    mustChangePassword: false,
    createdAt: "2026-05-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Michael Brown",
    email: "michael@toktickit.com",
    department: "IT Support",
    role: "IT_STAFF",
    isActive: true,
    mustChangePassword: false,
    createdAt: "2026-05-02T00:00:00Z",
    updatedAt: "2026-05-02T00:00:00Z",
  },
  {
    id: 3,
    name: "Jennifer Anderson",
    email: "jennifer@toktickit.com",
    department: "Marketing",
    role: "REQUESTER",
    isActive: true,
    mustChangePassword: false,
    createdAt: "2026-05-03T00:00:00Z",
    updatedAt: "2026-05-03T00:00:00Z",
  },
];

describe("UserManagement Component (UserManagement.test.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: mockCurrentAdmin,
      token: "test-admin-jwt",
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      updatePassword: vi.fn(),
    });

    vi.mocked(api.fetchAdminUsers).mockResolvedValue([...mockUsers]);
  });

  // -------------------------------------------------------------------------
  // UI-08: Admin User Management displays user list and open Create User modal
  // -------------------------------------------------------------------------
  describe("UI-08: User List Rendering & Creation Flow", () => {
    it("renders the user management page with user list and role badges", async () => {
      render(<UserManagement />);

      expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByTestId("loading-indicator")).not.toBeInTheDocument();
      });

      expect(screen.getByTestId("admin-user-management")).toBeInTheDocument();
      expect(screen.getByTestId("users-table")).toBeInTheDocument();

      // Check users rendered
      expect(screen.getByTestId("user-name-1")).toHaveTextContent("System Admin");
      expect(screen.getByTestId("user-name-2")).toHaveTextContent("Michael Brown");
      expect(screen.getByTestId("user-name-3")).toHaveTextContent("Jennifer Anderson");

      expect(screen.getByTestId("user-role-1")).toHaveTextContent("Administrator");
      expect(screen.getByTestId("user-role-2")).toHaveTextContent("IT Staff");
      expect(screen.getByTestId("user-role-3")).toHaveTextContent("Requester");

      expect(screen.getByTestId("user-status-1")).toHaveTextContent("Active");
    });

    it("filters user list when role filter changes", async () => {
      const user = userEvent.setup();
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByTestId("users-table")).toBeInTheDocument();
      });

      const roleFilter = screen.getByTestId("admin-role-filter");
      await user.selectOptions(roleFilter, "IT_STAFF");

      expect(api.fetchAdminUsers).toHaveBeenCalledWith(
        expect.objectContaining({ role: "IT_STAFF" })
      );
    });

    it("searches users when typing into search input", async () => {
      const user = userEvent.setup();
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByTestId("users-table")).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId("admin-search-input");
      await user.type(searchInput, "jennifer");

      expect(api.fetchAdminUsers).toHaveBeenCalledWith(
        expect.objectContaining({ search: "jennifer" })
      );
    });

    it("opens Create User modal and submits a valid new user", async () => {
      const user = userEvent.setup();
      const newUser: AdminUser = {
        id: 4,
        name: "David Lee",
        email: "david@toktickit.com",
        department: "Finance",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: true,
        createdAt: "2026-05-10T00:00:00Z",
        updatedAt: "2026-05-10T00:00:00Z",
      };
      vi.mocked(api.createAdminUser).mockResolvedValue(newUser);

      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByTestId("users-table")).toBeInTheDocument();
      });

      // Click Create New User button
      const createBtn = screen.getByTestId("create-user-button");
      await user.click(createBtn);

      // Verify modal is open
      expect(screen.getByTestId("create-user-modal")).toBeInTheDocument();
      expect(screen.getByTestId("create-user-name")).toBeInTheDocument();
      expect(screen.getByTestId("create-user-email")).toBeInTheDocument();
      expect(screen.getByTestId("create-user-role")).toBeInTheDocument();
      expect(screen.getByTestId("create-user-password")).toBeInTheDocument();

      // Fill in fields
      await user.type(screen.getByTestId("create-user-name"), "David Lee");
      await user.type(screen.getByTestId("create-user-email"), "david@toktickit.com");
      await user.type(screen.getByTestId("create-user-department"), "Finance");
      await user.selectOptions(screen.getByTestId("create-user-role"), "REQUESTER");
      await user.type(screen.getByTestId("create-user-password"), "InitialSecret123!");

      // Submit
      await user.click(screen.getByTestId("create-user-submit"));

      await waitFor(() => {
        expect(api.createAdminUser).toHaveBeenCalledWith({
          name: "David Lee",
          email: "david@toktickit.com",
          department: "Finance",
          role: "REQUESTER",
          initialPassword: "InitialSecret123!",
          isActive: true,
        });
      });

      // Modal closes
      await waitFor(() => {
        expect(screen.queryByTestId("create-user-modal")).not.toBeInTheDocument();
      });
    });

    it("displays error banner when duplicate email error occurs during creation", async () => {
      const user = userEvent.setup();
      vi.mocked(api.createAdminUser).mockRejectedValue(
        new Error("A user with this email address already exists.")
      );

      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByTestId("users-table")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("create-user-button"));

      await user.type(screen.getByTestId("create-user-name"), "Duplicate Admin");
      await user.type(screen.getByTestId("create-user-email"), "admin@toktickit.com");
      await user.type(screen.getByTestId("create-user-password"), "InitialSecret123!");

      await user.click(screen.getByTestId("create-user-submit"));

      await waitFor(() => {
        expect(screen.getByTestId("create-user-error")).toBeInTheDocument();
      });

      expect(screen.getByTestId("create-user-error")).toHaveTextContent(
        "A user with this email address already exists."
      );
    });
  });

  // -------------------------------------------------------------------------
  // UI-09: Admin User Management disables deactivation for current admin row
  // -------------------------------------------------------------------------
  describe("UI-09: User Edit & Self-Deactivation Guard Flow", () => {
    it("disables the active toggle switch with notice when editing the current admin account", async () => {
      const user = userEvent.setup();
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByTestId("users-table")).toBeInTheDocument();
      });

      // Click Edit on current admin row (id: 1)
      const editAdminBtn = screen.getByTestId("edit-user-btn-1");
      await user.click(editAdminBtn);

      expect(screen.getByTestId("edit-user-modal")).toBeInTheDocument();

      // Active toggle must be disabled
      const activeToggle = screen.getByTestId("edit-user-active-toggle");
      expect(activeToggle).toBeDisabled();

      // Self deactivation explanatory notice must be visible
      expect(screen.getByTestId("self-deactivation-notice")).toBeInTheDocument();
      expect(screen.getByTestId("self-deactivation-notice")).toHaveTextContent(
        "You cannot deactivate your own administrator account."
      );
    });

    it("enables the active toggle switch when editing another user account", async () => {
      const user = userEvent.setup();
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByTestId("users-table")).toBeInTheDocument();
      });

      // Click Edit on Michael Brown (id: 2)
      const editStaffBtn = screen.getByTestId("edit-user-btn-2");
      await user.click(editStaffBtn);

      expect(screen.getByTestId("edit-user-modal")).toBeInTheDocument();

      // Active toggle must be ENABLED for other users
      const activeToggle = screen.getByTestId("edit-user-active-toggle");
      expect(activeToggle).not.toBeDisabled();
      expect(screen.queryByTestId("self-deactivation-notice")).not.toBeInTheDocument();
    });

    it("successfully edits another user profile", async () => {
      const user = userEvent.setup();
      const updatedUser: AdminUser = {
        ...mockUsers[1],
        name: "Michael Brown Jr.",
        department: "Senior IT Support",
      };
      vi.mocked(api.updateAdminUser).mockResolvedValue(updatedUser);

      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByTestId("users-table")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("edit-user-btn-2"));

      const nameInput = screen.getByTestId("edit-user-name");
      await user.clear(nameInput);
      await user.type(nameInput, "Michael Brown Jr.");

      await user.click(screen.getByTestId("edit-user-save"));

      await waitFor(() => {
        expect(api.updateAdminUser).toHaveBeenCalledWith(2, {
          name: "Michael Brown Jr.",
          email: "michael@toktickit.com",
          department: "IT Support",
          role: "IT_STAFF",
          isActive: true,
        });
      });

      expect(screen.getByTestId("edit-user-success")).toBeInTheDocument();
    });

    it("allows resetting user password and displays success message", async () => {
      const user = userEvent.setup();
      vi.mocked(api.resetAdminUserPassword).mockResolvedValue({
        message: "Initial password reset successfully. User must change password at next login.",
        mustChangePassword: true,
      });

      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByTestId("users-table")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("edit-user-btn-2"));

      const resetInput = screen.getByTestId("reset-password-input");
      await user.type(resetInput, "NewTempPassword123!");

      const resetBtn = screen.getByTestId("reset-password-button");
      await user.click(resetBtn);

      await waitFor(() => {
        expect(api.resetAdminUserPassword).toHaveBeenCalledWith(2, "NewTempPassword123!");
      });

      expect(screen.getByTestId("reset-password-success")).toBeInTheDocument();
      expect(screen.getByTestId("reset-password-success")).toHaveTextContent(
        "Initial password reset successfully."
      );
    });
  });
});
