import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { RequesterProvider } from "../../src/context/RequesterContext";
import { CreateTicket } from "../../src/components/CreateTicket";
import * as api from "../../src/api";
import { Category, RelatedSystem, RequesterUser, Ticket } from "../../src/types";

// Mock API
vi.mock("../../src/api", () => ({
  fetchActiveRequesters: vi.fn(),
  fetchActiveCategories: vi.fn(),
  fetchActiveRelatedSystems: vi.fn(),
  createTicket: vi.fn(),
  checkSystem: vi.fn(),
}));

const mockRequester: RequesterUser = {
  id: 1,
  name: "Jennifer Anderson",
  email: "jennifer.a@toktickit.local",
  department: "Human Resources",
  isActive: true,
};

const mockCategories: Category[] = [
  { id: 1, name: "Account and Access", isActive: true },
  { id: 2, name: "Hardware", isActive: true },
  { id: 3, name: "Software", isActive: true },
  { id: 4, name: "Network", isActive: true },
];

const mockSystems: RelatedSystem[] = [
  { id: 1, name: "Corporate Laptop", description: "Standard issue laptop", isActive: true },
  { id: 2, name: "Campus Wi-Fi", description: "Campus wireless", isActive: true },
  { id: 3, name: "VPN", description: "Remote access", isActive: true },
];

const mockCreatedTicket: Ticket = {
  id: 101,
  ticketNumber: "TKT-2026-000001",
  summary: "Laptop battery drains quickly",
  description: "My laptop battery is draining much faster than usual even when idle.",
  requestedPriority: "HIGH",
  itPriority: null,
  currentStatus: "NEW",
  requesterId: 1,
  categoryId: 2,
  relatedSystemId: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("CreateTicket Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("toktickit_selected_requester", JSON.stringify(mockRequester));
    vi.mocked(api.fetchActiveRequesters).mockResolvedValue([mockRequester]);
    vi.mocked(api.fetchActiveCategories).mockResolvedValue(mockCategories);
    vi.mocked(api.fetchActiveRelatedSystems).mockResolvedValue(mockSystems);
  });

  it("renders form with read-only requester name and pre-populated reference data", async () => {
    render(
      <RequesterProvider>
        <CreateTicket />
      </RequesterProvider>
    );

    expect(screen.getByText("Create IT Support Ticket")).toBeInTheDocument();
    expect(screen.getByText("Jennifer Anderson")).toBeInTheDocument();
    expect(screen.getByText("(Human Resources)")).toBeInTheDocument();

    // Wait for dropdowns to be populated
    await waitFor(() => {
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    });

    const categorySelect = screen.getByLabelText(/Category/i) as HTMLSelectElement;
    expect(categorySelect.options.length).toBe(5); // 1 placeholder + 4 categories

    const systemSelect = screen.getByLabelText(/Related System/i) as HTMLSelectElement;
    expect(systemSelect.options.length).toBe(4); // 1 placeholder + 3 systems
  });

  it("triggers client-side validation on empty submission and blocks API call", async () => {
    render(
      <RequesterProvider>
        <CreateTicket />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByTestId("submit-ticket-button");
    fireEvent.click(submitBtn);

    // Expect field-level validation errors
    expect(screen.getByText(/Please select a ticket category/i)).toBeInTheDocument();
    expect(screen.getByText(/Please select an affected system/i)).toBeInTheDocument();
    expect(screen.getByText(/Ticket summary is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Description is required/i)).toBeInTheDocument();

    expect(api.createTicket).not.toHaveBeenCalled();
  });

  it("rejects oversized file attachment (> 5 MB)", async () => {
    render(
      <RequesterProvider>
        <CreateTicket />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    });

    const fileInput = document.getElementById("ticketAttachments") as HTMLInputElement;

    // Create a dummy oversized file (6 MB)
    const largeFile = new File(["x".repeat(6 * 1024 * 1024)], "large-file.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(screen.getByText(/exceeds maximum allowed size of 5 MB/i)).toBeInTheDocument();
  });

  it("displays busy state and disables submit button during in-flight submission", async () => {
    let resolveSubmission: (value: Ticket) => void;
    const submissionPromise = new Promise<Ticket>((resolve) => {
      resolveSubmission = resolve;
    });
    vi.mocked(api.createTicket).mockReturnValue(submissionPromise);

    render(
      <RequesterProvider>
        <CreateTicket />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    });

    // Fill valid form inputs
    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText(/Related System/i), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/Requested Priority/i), { target: { value: "HIGH" } });
    fireEvent.change(screen.getByLabelText(/Ticket Summary/i), {
      target: { value: "Laptop battery drains quickly" },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "My laptop battery is draining much faster than usual even when idle." },
    });

    const submitBtn = screen.getByTestId("submit-ticket-button");
    fireEvent.click(submitBtn);

    // Verify busy state
    expect(screen.getByText(/Submitting Ticket.../i)).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();

    // Resolve submission
    resolveSubmission!(mockCreatedTicket);

    await waitFor(() => {
      expect(screen.getByText("Ticket Created Successfully!")).toBeInTheDocument();
      expect(screen.getByTestId("created-ticket-number").textContent).toContain("TKT-2026-000001");
    });
  });

  it("handles API failure safely and preserves entered form values", async () => {
    vi.mocked(api.createTicket).mockRejectedValueOnce(
      new Error("Database connection lost. Please try again.")
    );

    render(
      <RequesterProvider>
        <CreateTicket />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    });

    // Fill inputs
    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText(/Related System/i), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/Ticket Summary/i), {
      target: { value: "Preserved Summary Content" },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "Preserved Description Content that is long enough." },
    });

    fireEvent.click(screen.getByTestId("submit-ticket-button"));

    await waitFor(() => {
      expect(screen.getByText(/Database connection lost/i)).toBeInTheDocument();
    });

    // Verify all input values are preserved!
    expect((screen.getByLabelText(/Ticket Summary/i) as HTMLInputElement).value).toBe(
      "Preserved Summary Content"
    );
    expect((screen.getByLabelText(/Description/i) as HTMLTextAreaElement).value).toBe(
      "Preserved Description Content that is long enough."
    );
    expect((screen.getByLabelText(/Category/i) as HTMLSelectElement).value).toBe("2");
    expect((screen.getByLabelText(/Related System/i) as HTMLSelectElement).value).toBe("1");
  });
});
