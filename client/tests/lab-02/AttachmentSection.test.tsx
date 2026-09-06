import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { RequesterProvider } from "../../src/context/RequesterContext";
import { AttachmentSection } from "../../src/components/AttachmentSection";
import * as api from "../../src/api";
import { Attachment, RequesterUser } from "../../src/types";

// Mock API
vi.mock("../../src/api", () => ({
  fetchActiveRequesters: vi.fn(),
  uploadAttachment: vi.fn(),
  downloadAttachment: vi.fn(),
  softRemoveAttachment: vi.fn(),
}));

const mockRequester: RequesterUser = {
  id: 1,
  name: "Jennifer Anderson",
  email: "jennifer.a@toktickit.local",
  department: "Human Resources",
  isActive: true,
};

const mockActiveAttachment: Attachment = {
  id: 1,
  ticketId: 101,
  originalName: "battery-diag.pdf",
  mimeType: "application/pdf",
  sizeBytes: 204800,
  isRemoved: false,
  createdAt: "2026-08-31T09:05:00.000Z",
};

const mockRemovedAttachment: Attachment = {
  id: 2,
  ticketId: 101,
  originalName: "old-screenshot.png",
  mimeType: "image/png",
  sizeBytes: 512000,
  isRemoved: true,
  removedAt: "2026-08-31T09:30:00.000Z",
  removalReason: "Uploaded wrong image by mistake",
  createdAt: "2026-08-31T09:00:00.000Z",
};

describe("AttachmentSection Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("toktickit_selected_requester", JSON.stringify(mockRequester));
    vi.mocked(api.fetchActiveRequesters).mockResolvedValue([mockRequester]);
  });

  it("renders active attachments with name, size, download button, and remove button", () => {
    render(
      <RequesterProvider>
        <AttachmentSection
          ticketId={101}
          attachments={[mockActiveAttachment]}
          onAttachmentChange={() => {}}
        />
      </RequesterProvider>
    );

    expect(screen.getByText("battery-diag.pdf")).toBeInTheDocument();
    expect(screen.getByText(/200 KB/i)).toBeInTheDocument();
    expect(screen.getByTestId("download-btn-1")).toBeInTheDocument();
    expect(screen.getByTestId("remove-btn-1")).toBeInTheDocument();
  });

  it("triggers downloadAttachment when download button is clicked", async () => {
    render(
      <RequesterProvider>
        <AttachmentSection
          ticketId={101}
          attachments={[mockActiveAttachment]}
          onAttachmentChange={() => {}}
        />
      </RequesterProvider>
    );

    const downloadBtn = screen.getByTestId("download-btn-1");
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(api.downloadAttachment).toHaveBeenCalledWith(
        1,
        1,
        "battery-diag.pdf"
      );
    });
  });

  it("renders soft-removed attachments with removal reason and disabled download label", () => {
    render(
      <RequesterProvider>
        <AttachmentSection
          ticketId={101}
          attachments={[mockRemovedAttachment]}
          onAttachmentChange={() => {}}
        />
      </RequesterProvider>
    );

    expect(screen.getByText("old-screenshot.png")).toBeInTheDocument();
    expect(screen.getByText(/Uploaded wrong image by mistake/i)).toBeInTheDocument();
    expect(screen.getByTestId("download-disabled-2")).toHaveTextContent("Download Disabled");
  });

  it("handles soft-remove modal interaction and calls softRemoveAttachment with reason", async () => {
    const onAttachmentChange = vi.fn();
    vi.mocked(api.softRemoveAttachment).mockResolvedValue({
      ...mockActiveAttachment,
      isRemoved: true,
      removalReason: "Document contains confidential personal info",
    });

    render(
      <RequesterProvider>
        <AttachmentSection
          ticketId={101}
          attachments={[mockActiveAttachment]}
          onAttachmentChange={onAttachmentChange}
        />
      </RequesterProvider>
    );

    // Click remove button to open modal
    const removeBtn = screen.getByTestId("remove-btn-1");
    fireEvent.click(removeBtn);

    expect(screen.getByTestId("removal-modal")).toBeInTheDocument();

    // Type removal reason
    const reasonInput = screen.getByTestId("removal-reason-input");
    fireEvent.change(reasonInput, {
      target: { value: "Document contains confidential personal info" },
    });

    // Confirm removal
    const confirmBtn = screen.getByTestId("modal-confirm-btn");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(api.softRemoveAttachment).toHaveBeenCalledWith(
        101,
        1,
        1,
        "Document contains confidential personal info"
      );
      expect(onAttachmentChange).toHaveBeenCalledTimes(1);
    });
  });

  it("allows uploading a valid file and triggers onAttachmentChange", async () => {
    const onAttachmentChange = vi.fn();
    const newAttachment: Attachment = {
      id: 3,
      ticketId: 101,
      originalName: "system-logs.pdf",
      mimeType: "application/pdf",
      sizeBytes: 102400,
      isRemoved: false,
      createdAt: "2026-08-31T09:40:00.000Z",
    };
    vi.mocked(api.uploadAttachment).mockResolvedValue(newAttachment);

    render(
      <RequesterProvider>
        <AttachmentSection
          ticketId={101}
          attachments={[]}
          onAttachmentChange={onAttachmentChange}
        />
      </RequesterProvider>
    );

    const fileInput = screen.getByTestId("file-input");
    const file = new File(["dummy pdf content"], "system-logs.pdf", { type: "application/pdf" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(api.uploadAttachment).toHaveBeenCalledWith(101, 1, file);
      expect(onAttachmentChange).toHaveBeenCalledTimes(1);
    });
  });

  it("enforces max 5 active attachments limit by displaying alert and disabling upload", () => {
    const fiveActiveAttachments: Attachment[] = [1, 2, 3, 4, 5].map((id) => ({
      id,
      ticketId: 101,
      originalName: `file-${id}.pdf`,
      mimeType: "application/pdf",
      sizeBytes: 1024,
      isRemoved: false,
      createdAt: "2026-08-31T09:00:00.000Z",
    }));

    render(
      <RequesterProvider>
        <AttachmentSection
          ticketId={101}
          attachments={fiveActiveAttachments}
          onAttachmentChange={() => {}}
        />
      </RequesterProvider>
    );

    expect(screen.getByTestId("max-attachments-alert")).toBeInTheDocument();
    expect(screen.getByTestId("upload-btn")).toBeDisabled();
    expect(screen.getByTestId("file-input")).toBeDisabled();
  });
});
