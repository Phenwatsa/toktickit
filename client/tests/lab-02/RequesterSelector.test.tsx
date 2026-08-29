import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { RequesterProvider, useRequester } from "../../src/context/RequesterContext";
import { RequesterSelector } from "../../src/components/RequesterSelector";
import * as api from "../../src/api";
import { RequesterUser } from "../../src/types";

// Mock API
vi.mock("../../src/api", () => ({
  fetchActiveRequesters: vi.fn(),
  checkSystem: vi.fn(),
}));

const mockActiveRequesters: RequesterUser[] = [
  {
    id: 1,
    name: "Jennifer Anderson",
    email: "jennifer.a@toktickit.local",
    department: "Human Resources",
    isActive: true,
  },
  {
    id: 2,
    name: "David Lee",
    email: "david.l@toktickit.local",
    department: "Engineering",
    isActive: true,
  },
];

function TestConsumer() {
  const { currentRequester } = useRequester();
  return (
    <div>
      <span data-testid="current-user">
        {currentRequester ? currentRequester.name : "None"}
      </span>
    </div>
  );
}

describe("RequesterSelector Component & Context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders title, explanatory subtext, and Lab 3 notice after loading", async () => {
    vi.mocked(api.fetchActiveRequesters).mockResolvedValueOnce(mockActiveRequesters);

    render(
      <RequesterProvider>
        <RequesterSelector onContinue={() => {}} />
      </RequesterProvider>
    );

    expect(screen.getByText("Select Development Requester")).toBeInTheDocument();
    expect(
      screen.getByText(/This is for testing only and is not a login screen/i)
    ).toBeInTheDocument();

    // Wait for active requesters to finish loading
    await waitFor(() => {
      expect(screen.getByText(/Authentication coming in Lab 3/i)).toBeInTheDocument();
    });
  });

  it("populates active requesters in dropdown and allows selection", async () => {
    vi.mocked(api.fetchActiveRequesters).mockResolvedValueOnce(mockActiveRequesters);
    const onContinue = vi.fn();

    render(
      <RequesterProvider>
        <RequesterSelector onContinue={onContinue} />
        <TestConsumer />
      </RequesterProvider>
    );

    // Wait for dropdown to populate
    await waitFor(() => {
      expect(screen.getByLabelText(/Development Requester/i)).toBeInTheDocument();
    });

    const select = screen.getByLabelText(/Development Requester/i) as HTMLSelectElement;
    expect(select.options.length).toBe(3); // 1 placeholder + 2 users

    // Select David Lee
    fireEvent.change(select, { target: { value: "2" } });
    expect(select.value).toBe("2");

    // Click Continue
    const continueBtn = screen.getByRole("button", { name: /Continue/i });
    fireEvent.click(continueBtn);

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("current-user").textContent).toBe("David Lee");
  });

  it("renders safe error state when API fails to load requesters", async () => {
    vi.mocked(api.fetchActiveRequesters).mockRejectedValueOnce(
      new Error("Network error loading requesters")
    );

    render(
      <RequesterProvider>
        <RequesterSelector onContinue={() => {}} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load requesters/i)).toBeInTheDocument();
      expect(screen.getByText(/Network error loading requesters/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
  });
});
