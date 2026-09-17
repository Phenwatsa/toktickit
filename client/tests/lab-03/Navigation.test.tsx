import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "../../src/components/Header";
import * as AuthContextModule from "../../src/context/AuthContext";
import { User } from "../../src/types";

describe("Role-Based Navigation Header (Navigation.test.tsx - UI-10)", () => {
  const mockLogout = vi.fn();
  const mockNavigate = vi.fn();

  function renderHeaderWithUser(user: User | null) {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user,
      token: user ? "mock-token" : null,
      isAuthenticated: !!user,
      isLoading: false,
      login: vi.fn(),
      logout: mockLogout,
      updatePassword: vi.fn(),
    });

    return render(
      <Header currentView="my-tickets" onNavigate={mockNavigate} />
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("UI-10: Requester sees only Requester navigation links and Requester badge", () => {
    const requesterUser: User = {
      id: 1,
      name: "Jennifer Anderson",
      email: "jennifer.a@toktickit.local",
      role: "REQUESTER",
      department: "Human Resources",
      mustChangePassword: false,
      isActive: true,
    };

    renderHeaderWithUser(requesterUser);

    // Visible Requester links
    expect(screen.getByTestId("nav-my-tickets")).toBeInTheDocument();
    expect(screen.getByTestId("nav-create-ticket")).toBeInTheDocument();
    expect(screen.getByTestId("nav-health-check")).toBeInTheDocument();

    // Hidden Staff and Admin links
    expect(screen.queryByTestId("nav-staff-queue")).not.toBeInTheDocument();
    expect(screen.queryByTestId("nav-admin-users")).not.toBeInTheDocument();

    // User display name & Role badge
    expect(screen.getByTestId("user-display-name")).toHaveTextContent("Jennifer Anderson");
    expect(screen.getByTestId("user-role-badge")).toHaveTextContent("Requester");
  });

  it("UI-10: IT Staff sees only Staff Ticket Queue and IT Staff badge", () => {
    const staffUser: User = {
      id: 2,
      name: "Alice Smith",
      email: "alice.staff@toktickit.local",
      role: "IT_STAFF",
      department: "IT Support",
      mustChangePassword: false,
      isActive: true,
    };

    renderHeaderWithUser(staffUser);

    // Visible Staff link
    expect(screen.getByTestId("nav-staff-queue")).toBeInTheDocument();

    // Hidden Requester and Admin links
    expect(screen.queryByTestId("nav-my-tickets")).not.toBeInTheDocument();
    expect(screen.queryByTestId("nav-create-ticket")).not.toBeInTheDocument();
    expect(screen.queryByTestId("nav-health-check")).not.toBeInTheDocument();
    expect(screen.queryByTestId("nav-admin-users")).not.toBeInTheDocument();

    // User display name & Role badge
    expect(screen.getByTestId("user-display-name")).toHaveTextContent("Alice Smith");
    expect(screen.getByTestId("user-role-badge")).toHaveTextContent("IT Staff");
  });

  it("UI-10: Administrator sees only User Management and Administrator badge", () => {
    const adminUser: User = {
      id: 3,
      name: "System Administrator",
      email: "admin@toktickit.local",
      role: "ADMINISTRATOR",
      department: "IT Administration",
      mustChangePassword: false,
      isActive: true,
    };

    renderHeaderWithUser(adminUser);

    // Visible Admin link
    expect(screen.getByTestId("nav-admin-users")).toBeInTheDocument();

    // Hidden Requester and Staff links
    expect(screen.queryByTestId("nav-my-tickets")).not.toBeInTheDocument();
    expect(screen.queryByTestId("nav-create-ticket")).not.toBeInTheDocument();
    expect(screen.queryByTestId("nav-health-check")).not.toBeInTheDocument();
    expect(screen.queryByTestId("nav-staff-queue")).not.toBeInTheDocument();

    // User display name & Role badge
    expect(screen.getByTestId("user-display-name")).toHaveTextContent("System Administrator");
    expect(screen.getByTestId("user-role-badge")).toHaveTextContent("Administrator");
  });

  it("triggers logout when clicking desktop Logout button", async () => {
    const user = userEvent.setup();
    const requesterUser: User = {
      id: 1,
      name: "Jennifer Anderson",
      email: "jennifer.a@toktickit.local",
      role: "REQUESTER",
      mustChangePassword: false,
      isActive: true,
    };

    renderHeaderWithUser(requesterUser);

    const logoutBtn = screen.getByTestId("header-logout-btn");
    await user.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("opens mobile drawer and displays synchronized role links and mobile logout button", async () => {
    const user = userEvent.setup();
    const requesterUser: User = {
      id: 1,
      name: "Jennifer Anderson",
      email: "jennifer.a@toktickit.local",
      role: "REQUESTER",
      mustChangePassword: false,
      isActive: true,
    };

    renderHeaderWithUser(requesterUser);

    const hamburgerBtn = screen.getByTestId("hamburger-menu-btn");
    await user.click(hamburgerBtn);

    expect(screen.getByTestId("mobile-drawer")).toBeInTheDocument();
    expect(screen.getByTestId("drawer-user-card")).toBeInTheDocument();
    expect(screen.getByTestId("drawer-nav-my-tickets")).toBeInTheDocument();
    expect(screen.getByTestId("drawer-nav-create-ticket")).toBeInTheDocument();

    const mobileLogoutBtn = screen.getByTestId("drawer-logout-btn");
    await user.click(mobileLogoutBtn);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("completely omits the Lab 2 mock development requester selector", () => {
    const requesterUser: User = {
      id: 1,
      name: "Jennifer Anderson",
      email: "jennifer.a@toktickit.local",
      role: "REQUESTER",
      mustChangePassword: false,
      isActive: true,
    };

    renderHeaderWithUser(requesterUser);

    expect(screen.queryByTestId("change-requester-btn")).not.toBeInTheDocument();
    expect(screen.queryByText(/switch development requester/i)).not.toBeInTheDocument();
  });
});
