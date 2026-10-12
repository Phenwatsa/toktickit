import { getPrisma } from "../src/prisma.js";

// ---------------------------------------------------------------------------
// Lab 4 — Idempotent Seed Script (Spec DD)
// Populates:
// 1. Categories (4 active)
// 2. Related Systems (7 active)
// 3. Users:
//    - Requesters (4 active, 1 inactive, 1 first-login, 1 fresh with 0 tickets)
//    - IT Staff (3 active, 1 inactive, 1 fresh with 0 tickets)
//    - Administrator (1 active)
// 4. Sample Tickets covering all 5 dimensions:
//    - All 8 lifecycle statuses (NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, CLOSED, REOPENED, CANCELLED)
//    - All 4 IT priorities (LOW, MEDIUM, HIGH, URGENT)
//    - Ownership (Assigned and Unassigned)
//    - Actions Taken multiplicity (0, 1, and multiple >= 2) with varied staff performers
//    - Dashboard profiles (Non-zero and zero metrics baselines)
// ---------------------------------------------------------------------------

// Precomputed bcrypt hash of 'Password123!' (cost factor 10)
const DEFAULT_PASSWORD_HASH = "$2a$10$YFM5cCrfTzXKdMJqMYdKwef2eP16HYUPht8JPByEaTqNmUTrNms4C";

async function main() {
  const prisma = getPrisma();

  // 1. Seed Categories
  const categories = [
    { name: "Account and Access", isActive: true },
    { name: "Hardware", isActive: true },
    { name: "Software", isActive: true },
    { name: "Network", isActive: true },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { isActive: cat.isActive },
      create: { name: cat.name, isActive: cat.isActive },
    });
  }
  console.log(`Seeded ${categories.length} categories.`);

  // 2. Seed Related Systems
  const relatedSystems = [
    { name: "Corporate Laptop", description: "Standard issue laptop hardware", isActive: true },
    { name: "Campus Wi-Fi", description: "University wireless network", isActive: true },
    { name: "VPN", description: "Remote secure access", isActive: true },
    { name: "Email", description: "Office 365 / Webmail service", isActive: true },
    { name: "LEB2 App", description: "Learning environment platform", isActive: true },
    { name: "Grade Submission App", description: "Faculty grading system", isActive: true },
    { name: "Printer", description: "Department network printers", isActive: true },
  ];

  for (const sys of relatedSystems) {
    await prisma.relatedSystem.upsert({
      where: { name: sys.name },
      update: { description: sys.description, isActive: sys.isActive },
      create: { name: sys.name, description: sys.description, isActive: sys.isActive },
    });
  }
  console.log(`Seeded ${relatedSystems.length} related systems.`);

  // 3. Seed Users (Requesters, IT Staff, Administrator)
  const users = [
    // Requesters (active, inactive, first-login, fresh)
    {
      name: "Jennifer Anderson",
      email: "jennifer.a@toktickit.local",
      department: "Human Resources",
      role: "REQUESTER" as const,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "David Lee",
      email: "david.l@toktickit.local",
      department: "Engineering",
      role: "REQUESTER" as const,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Sarah Johnson",
      email: "sarah.j@toktickit.local",
      department: "Finance",
      role: "REQUESTER" as const,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Michael Brown",
      email: "michael.b@toktickit.local",
      department: "Marketing",
      role: "REQUESTER" as const,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Alex Wilson",
      email: "alex.w@toktickit.local",
      department: "Contractor",
      role: "REQUESTER" as const,
      isActive: false, // Inactive requester
      mustChangePassword: false,
    },
    {
      name: "First Login Requester",
      email: "firstlogin.req@toktickit.local",
      department: "Sales",
      role: "REQUESTER" as const,
      isActive: true,
      mustChangePassword: true, // Requires password change
    },
    {
      name: "Fresh Requester",
      email: "fresh.requester@toktickit.local",
      department: "Operations",
      role: "REQUESTER" as const,
      isActive: true,
      mustChangePassword: false, // Zero tickets baseline for empty-state verification
    },

    // IT Staff (active, inactive, fresh)
    {
      name: "Alice Smith",
      email: "alice.staff@toktickit.local",
      department: "IT Support",
      role: "IT_STAFF" as const,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Bob Jones",
      email: "bob.staff@toktickit.local",
      department: "IT Support",
      role: "IT_STAFF" as const,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Charlie Davis",
      email: "charlie.staff@toktickit.local",
      department: "IT Infrastructure",
      role: "IT_STAFF" as const,
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Dave Retired",
      email: "dave.staff@toktickit.local",
      department: "IT Support",
      role: "IT_STAFF" as const,
      isActive: false, // Inactive staff
      mustChangePassword: false,
    },
    {
      name: "Fresh Staff",
      email: "fresh.staff@toktickit.local",
      department: "IT Support",
      role: "IT_STAFF" as const,
      isActive: true,
      mustChangePassword: false, // Zero assigned tickets baseline
    },

    // Administrator (active)
    {
      name: "System Administrator",
      email: "admin@toktickit.local",
      department: "IT Administration",
      role: "ADMINISTRATOR" as const,
      isActive: true,
      mustChangePassword: false,
    },
  ];

  const seededUsers: Record<string, any> = {};

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        passwordHash: DEFAULT_PASSWORD_HASH,
        department: u.department,
        role: u.role,
        isActive: u.isActive,
        mustChangePassword: u.mustChangePassword,
      },
      create: {
        name: u.name,
        email: u.email,
        passwordHash: DEFAULT_PASSWORD_HASH,
        department: u.department,
        role: u.role,
        isActive: u.isActive,
        mustChangePassword: u.mustChangePassword,
      },
    });
    seededUsers[u.email] = user;
  }
  console.log(`Seeded ${users.length} users (Requesters, IT Staff, Admin).`);

  // 4. Seed Reference Entities for Tickets
  const catAccount = await prisma.category.findUnique({ where: { name: "Account and Access" } });
  const catHardware = await prisma.category.findUnique({ where: { name: "Hardware" } });
  const catNetwork = await prisma.category.findUnique({ where: { name: "Network" } });
  const catSoftware = await prisma.category.findUnique({ where: { name: "Software" } });

  const sysLaptop = await prisma.relatedSystem.findUnique({ where: { name: "Corporate Laptop" } });
  const sysVPN = await prisma.relatedSystem.findUnique({ where: { name: "VPN" } });
  const sysEmail = await prisma.relatedSystem.findUnique({ where: { name: "Email" } });
  const sysGrade = await prisma.relatedSystem.findUnique({ where: { name: "Grade Submission App" } });

  if (!catAccount || !catHardware || !catNetwork || !catSoftware || !sysLaptop || !sysVPN || !sysEmail || !sysGrade) {
    throw new Error("Categories or systems missing for ticket seeding");
  }

  // 5. Seed Realistic Tickets Covering All 5 Dimensions
  const sampleTickets = [
    {
      ticketNumber: "TKT-2026-000101",
      summary: "Cannot access Office 365 email portal",
      description: "Getting error AADSTS50020 when authenticating via SSO.",
      requestedPriority: "HIGH" as const,
      itPriority: "HIGH" as const,
      currentStatus: "NEW" as const,
      problemAppearsResolved: false,
      requesterId: seededUsers["jennifer.a@toktickit.local"].id,
      categoryId: catAccount.id,
      relatedSystemId: sysEmail.id,
      ticketOwnerId: null, // Unassigned
    },
    {
      ticketNumber: "TKT-2026-000102",
      summary: "Laptop screen flickering intermittently after sleep",
      description: "External monitor and built-in screen flicker violently after waking up.",
      requestedPriority: "MEDIUM" as const,
      itPriority: "HIGH" as const,
      currentStatus: "IN_PROGRESS" as const,
      problemAppearsResolved: false,
      requesterId: seededUsers["david.l@toktickit.local"].id,
      categoryId: catHardware.id,
      relatedSystemId: sysLaptop.id,
      ticketOwnerId: seededUsers["alice.staff@toktickit.local"].id, // Assigned
      comments: [
        {
          authorId: seededUsers["alice.staff@toktickit.local"].id,
          content: "Investigating the GPU driver crash logs. Please keep the laptop connected to power.",
        },
      ],
      notes: [
        {
          authorId: seededUsers["alice.staff@toktickit.local"].id,
          content: "Suspected hardware display ribbon fault or RAM slot 2 instability.",
        },
      ],
      actions: [
        {
          performedById: seededUsers["alice.staff@toktickit.local"].id, // Performed by owner
          actionDateTime: new Date("2026-10-10T09:30:00.000Z"),
          actionDescription: "Ran hardware diagnostics on display ribbon and memory.",
          result: "No GPU artifacts detected under benchmark test.",
          isFollowUpRequired: true,
          followUpNote: "Monitor display connection stability after driver update.",
          attachmentNotes: "diag-log-01.txt",
        },
        {
          performedById: seededUsers["bob.staff@toktickit.local"].id, // Performed by other staff member
          actionDateTime: new Date("2026-10-10T11:15:00.000Z"),
          actionDescription: "Replaced HDMI external dongle and updated Intel UHD display drivers.",
          result: "External display output restored to 60Hz 1080p.",
          isFollowUpRequired: false,
        },
      ],
    },
    {
      ticketNumber: "TKT-2026-000103",
      summary: "Unable to establish VPN connection from home",
      description: "Client reports timeout at TLS negotiation stage.",
      requestedPriority: "LOW" as const,
      itPriority: "LOW" as const,
      currentStatus: "WAITING_FOR_REQUESTER" as const,
      problemAppearsResolved: false,
      requesterId: seededUsers["sarah.j@toktickit.local"].id,
      categoryId: catNetwork.id,
      relatedSystemId: sysVPN.id,
      ticketOwnerId: seededUsers["bob.staff@toktickit.local"].id,
      comments: [
        {
          authorId: seededUsers["bob.staff@toktickit.local"].id,
          content: "We verified the gateway is reachable. Could you check if your home router blocks UDP 1194?",
        },
      ],
      actions: [
        {
          performedById: seededUsers["bob.staff@toktickit.local"].id,
          actionDateTime: new Date("2026-10-10T10:00:00.000Z"),
          actionDescription: "Verified OpenVPN gateway handshake and firewall routes.",
          result: "Gateway responds on port 1194; requested user verification.",
          isFollowUpRequired: true,
          followUpNote: "Wait for requester confirmation on home Wi-Fi test.",
        },
      ],
    },
    {
      ticketNumber: "TKT-2026-000104",
      summary: "Grade Submission portal throws session expired during CSV upload",
      description: "Uploading the final exam grades spreadsheet causes an unexpected session drop.",
      requestedPriority: "URGENT" as const,
      itPriority: "URGENT" as const,
      currentStatus: "RESOLVED" as const,
      problemAppearsResolved: true,
      requesterId: seededUsers["michael.b@toktickit.local"].id,
      categoryId: catSoftware.id,
      relatedSystemId: sysGrade.id,
      ticketOwnerId: seededUsers["charlie.staff@toktickit.local"].id,
      comments: [
        {
          authorId: seededUsers["charlie.staff@toktickit.local"].id,
          content: "Hotfix deployed to production web node. Session timeout increased to 30 minutes.",
        },
      ],
      notes: [
        {
          authorId: seededUsers["charlie.staff@toktickit.local"].id,
          content: "Root cause was proxy buffer limit truncation on multipart payload.",
        },
      ],
      actions: [
        {
          performedById: seededUsers["charlie.staff@toktickit.local"].id,
          actionDateTime: new Date("2026-10-10T14:00:00.000Z"),
          actionDescription: "Applied hotfix to multipart form parser on production proxy.",
          result: "Grade upload succeeds for files up to 25MB.",
          isFollowUpRequired: false,
        },
      ],
    },
    {
      ticketNumber: "TKT-2026-000105",
      summary: "Classroom 401 projector HDMI signal loss",
      description: "HDMI port intermittently loses connection during presentations.",
      requestedPriority: "MEDIUM" as const,
      itPriority: "MEDIUM" as const,
      currentStatus: "NEW" as const,
      problemAppearsResolved: false,
      requesterId: seededUsers["jennifer.a@toktickit.local"].id,
      categoryId: catHardware.id,
      relatedSystemId: sysLaptop.id,
      ticketOwnerId: null,
    },
    {
      ticketNumber: "TKT-2026-000106",
      summary: "Wi-Fi authentication failed in Building B 3rd floor",
      description: "Campus Wi-Fi certificate validation error on MacBook.",
      requestedPriority: "HIGH" as const,
      itPriority: "HIGH" as const,
      currentStatus: "IN_PROGRESS" as const,
      problemAppearsResolved: false,
      requesterId: seededUsers["david.l@toktickit.local"].id,
      categoryId: catNetwork.id,
      relatedSystemId: sysVPN.id,
      ticketOwnerId: seededUsers["alice.staff@toktickit.local"].id,
      actions: [
        {
          performedById: seededUsers["alice.staff@toktickit.local"].id,
          actionDateTime: new Date("2026-10-10T13:20:00.000Z"),
          actionDescription: "Renewed 802.1x RADIUS client certificate profile on device.",
          result: "Campus Wi-Fi authentication successful with valid cert chain.",
          isFollowUpRequired: false,
        },
      ],
    },
    {
      ticketNumber: "TKT-2026-000107",
      summary: "Request new software license for MATLAB",
      description: "License key expired for engineering department workstation.",
      requestedPriority: "LOW" as const,
      itPriority: "LOW" as const,
      currentStatus: "NEW" as const,
      problemAppearsResolved: false,
      requesterId: seededUsers["sarah.j@toktickit.local"].id,
      categoryId: catSoftware.id,
      relatedSystemId: sysGrade.id,
      ticketOwnerId: null,
    },
    {
      ticketNumber: "TKT-2026-000108",
      summary: "Printer in Admin office paper jam sensor broken",
      description: "Department printer shows paper jam even when tray is empty.",
      requestedPriority: "MEDIUM" as const,
      itPriority: "MEDIUM" as const,
      currentStatus: "NEW" as const,
      problemAppearsResolved: false,
      requesterId: seededUsers["michael.b@toktickit.local"].id,
      categoryId: catHardware.id,
      relatedSystemId: sysLaptop.id,
      ticketOwnerId: null,
    },
    {
      ticketNumber: "TKT-2026-000109",
      summary: "Account locked after 5 failed password attempts",
      description: "User locked out of corporate directory.",
      requestedPriority: "HIGH" as const,
      itPriority: "HIGH" as const,
      currentStatus: "NEW" as const,
      problemAppearsResolved: false,
      requesterId: seededUsers["jennifer.a@toktickit.local"].id,
      categoryId: catAccount.id,
      relatedSystemId: sysEmail.id,
      ticketOwnerId: null,
    },
    {
      ticketNumber: "TKT-2026-000110",
      summary: "VPN client configuration profile corrupt",
      description: "Need new OpenVPN ovpn config file for macOS Sequoia.",
      requestedPriority: "LOW" as const,
      itPriority: "LOW" as const,
      currentStatus: "WAITING_FOR_REQUESTER" as const,
      problemAppearsResolved: false,
      requesterId: seededUsers["david.l@toktickit.local"].id,
      categoryId: catNetwork.id,
      relatedSystemId: sysVPN.id,
      ticketOwnerId: seededUsers["bob.staff@toktickit.local"].id,
    },
    {
      ticketNumber: "TKT-2026-000111",
      summary: "LEB2 assignment submission returns 502 bad gateway",
      description: "Students cannot upload zip archive assignments.",
      requestedPriority: "URGENT" as const,
      itPriority: "URGENT" as const,
      currentStatus: "IN_PROGRESS" as const,
      problemAppearsResolved: false,
      requesterId: seededUsers["sarah.j@toktickit.local"].id,
      categoryId: catSoftware.id,
      relatedSystemId: sysGrade.id,
      ticketOwnerId: seededUsers["charlie.staff@toktickit.local"].id,
      actions: [
        {
          performedById: seededUsers["alice.staff@toktickit.local"].id, // Performed by other staff member
          actionDateTime: new Date("2026-10-10T15:00:00.000Z"),
          actionDescription: "Cleared redis worker cache and restarted queue worker service.",
          result: "Queue lag dropped from 14s to 200ms.",
          isFollowUpRequired: false,
        },
      ],
    },
    {
      ticketNumber: "TKT-2026-000112",
      summary: "Dual monitor dock not recognizing second display",
      description: "DisplayPort over USB-C dock only outputs to single monitor.",
      requestedPriority: "MEDIUM" as const,
      itPriority: "LOW" as const,
      currentStatus: "NEW" as const,
      problemAppearsResolved: false,
      requesterId: seededUsers["michael.b@toktickit.local"].id,
      categoryId: catHardware.id,
      relatedSystemId: sysLaptop.id,
      ticketOwnerId: null,
    },
    {
      ticketNumber: "TKT-2026-000113",
      summary: "Request guest Wi-Fi access voucher for symposium",
      description: "Visiting researchers require 3-day guest access passes.",
      requestedPriority: "LOW" as const,
      itPriority: "LOW" as const,
      currentStatus: "RESOLVED" as const,
      problemAppearsResolved: true,
      requesterId: seededUsers["jennifer.a@toktickit.local"].id,
      categoryId: catNetwork.id,
      relatedSystemId: sysVPN.id,
      ticketOwnerId: seededUsers["alice.staff@toktickit.local"].id,
      actions: [
        {
          performedById: seededUsers["alice.staff@toktickit.local"].id,
          actionDateTime: new Date("2026-10-10T16:00:00.000Z"),
          actionDescription: "Generated visitor Wi-Fi credentials for 10 guest researchers.",
          result: "Vouchers delivered to requester email.",
          isFollowUpRequired: false,
        },
      ],
    },
    {
      ticketNumber: "TKT-2026-000114",
      summary: "Email attachment size limit increase request",
      description: "Need to send high resolution engineering CAD drawings.",
      requestedPriority: "LOW" as const,
      itPriority: "LOW" as const,
      currentStatus: "CLOSED" as const,
      problemAppearsResolved: true,
      requesterId: seededUsers["david.l@toktickit.local"].id,
      categoryId: catAccount.id,
      relatedSystemId: sysEmail.id,
      ticketOwnerId: seededUsers["bob.staff@toktickit.local"].id,
      actions: [
        {
          performedById: seededUsers["bob.staff@toktickit.local"].id,
          actionDateTime: new Date("2026-10-10T11:00:00.000Z"),
          actionDescription: "Assigned Microsoft 365 E5 license addon for 50MB attachments.",
          result: "User mailbox quota upgraded.",
          isFollowUpRequired: false,
        },
      ],
    },
    {
      ticketNumber: "TKT-2026-000115",
      summary: "Keycard door access failure at Server Room 2",
      description: "RFID badge reader beeps red for authorized staff.",
      requestedPriority: "URGENT" as const,
      itPriority: "URGENT" as const,
      currentStatus: "OPEN" as const,
      problemAppearsResolved: false,
      requesterId: seededUsers["sarah.j@toktickit.local"].id,
      categoryId: catHardware.id,
      relatedSystemId: sysLaptop.id,
      ticketOwnerId: seededUsers["alice.staff@toktickit.local"].id,
    },
    {
      ticketNumber: "TKT-2026-000116",
      summary: "Intermittent packet loss on Core Switch 3 trunk link",
      description: "Ping tests show 8% packet loss during peak university hours.",
      requestedPriority: "HIGH" as const,
      itPriority: "HIGH" as const,
      currentStatus: "REOPENED" as const,
      problemAppearsResolved: false,
      requesterId: seededUsers["jennifer.a@toktickit.local"].id,
      categoryId: catNetwork.id,
      relatedSystemId: sysVPN.id,
      ticketOwnerId: seededUsers["bob.staff@toktickit.local"].id,
      actions: [
        {
          performedById: seededUsers["bob.staff@toktickit.local"].id, // Owner
          actionDateTime: new Date("2026-10-10T08:00:00.000Z"),
          actionDescription: "Inspected trunk port statistics and replaced SFP+ optical transceiver.",
          result: "Optical receive power normalized to -3.2 dBm.",
          isFollowUpRequired: true,
          followUpNote: "Monitor CRC error counters over the next 48 hours.",
        },
        {
          performedById: seededUsers["charlie.staff@toktickit.local"].id, // Other staff
          actionDateTime: new Date("2026-10-10T16:30:00.000Z"),
          actionDescription: "Applied firmware patch to core switch backplane ASIC.",
          result: "Packet drop rate eliminated completely under load.",
          isFollowUpRequired: false,
        },
      ],
    },
    {
      ticketNumber: "TKT-2026-000117",
      summary: "Duplicate request for monitor stand replacement",
      description: "Submitted in error; user already received replacement stand from facilities.",
      requestedPriority: "LOW" as const,
      itPriority: "LOW" as const,
      currentStatus: "CANCELLED" as const,
      problemAppearsResolved: false,
      requesterId: seededUsers["david.l@toktickit.local"].id,
      categoryId: catHardware.id,
      relatedSystemId: sysLaptop.id,
      ticketOwnerId: null,
    },
    {
      ticketNumber: "TKT-2026-000118",
      summary: "New employee onboarding: Software bundle installation",
      description: "Install development toolchains and Slack on new laptop.",
      requestedPriority: "MEDIUM" as const,
      itPriority: "MEDIUM" as const,
      currentStatus: "OPEN" as const,
      problemAppearsResolved: false,
      requesterId: seededUsers["michael.b@toktickit.local"].id,
      categoryId: catSoftware.id,
      relatedSystemId: sysLaptop.id,
      ticketOwnerId: seededUsers["charlie.staff@toktickit.local"].id,
    },
  ];

  for (const t of sampleTickets) {
    const { comments, notes, actions, ...ticketData } = t as any;
    const ticket = await prisma.ticket.upsert({
      where: { ticketNumber: ticketData.ticketNumber },
      update: {
        summary: ticketData.summary,
        description: ticketData.description,
        requestedPriority: ticketData.requestedPriority,
        itPriority: ticketData.itPriority,
        currentStatus: ticketData.currentStatus,
        problemAppearsResolved: ticketData.problemAppearsResolved,
        requesterId: ticketData.requesterId,
        categoryId: ticketData.categoryId,
        relatedSystemId: ticketData.relatedSystemId,
        ticketOwnerId: ticketData.ticketOwnerId,
      },
      create: ticketData,
    });

    if (comments && comments.length > 0) {
      for (const c of comments) {
        const existingComment = await prisma.publicComment.findFirst({
          where: { ticketId: ticket.id, content: c.content },
        });
        if (!existingComment) {
          await prisma.publicComment.create({
            data: {
              ticketId: ticket.id,
              authorId: c.authorId,
              content: c.content,
            },
          });
        }
      }
    }

    if (notes && notes.length > 0) {
      for (const n of notes) {
        const existingNote = await prisma.internalNote.findFirst({
          where: { ticketId: ticket.id, content: n.content },
        });
        if (!existingNote) {
          await prisma.internalNote.create({
            data: {
              ticketId: ticket.id,
              authorId: n.authorId,
              content: n.content,
            },
          });
        }
      }
    }

    if (actions && actions.length > 0) {
      for (const a of actions) {
        const existingAction = await prisma.actionTaken.findFirst({
          where: { ticketId: ticket.id, actionDescription: a.actionDescription },
        });
        if (!existingAction) {
          await prisma.actionTaken.create({
            data: {
              ticketId: ticket.id,
              actionDateTime: a.actionDateTime,
              actionDescription: a.actionDescription,
              result: a.result,
              performedById: a.performedById,
              isFollowUpRequired: a.isFollowUpRequired,
              followUpNote: a.followUpNote ?? null,
              attachmentNotes: a.attachmentNotes ?? null,
            },
          });
        }
      }
    }
  }

  console.log(`Seeded ${sampleTickets.length} sample tickets with comments, notes, and actions taken.`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
