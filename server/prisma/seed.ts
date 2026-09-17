import { getPrisma } from "../src/prisma.js";

// ---------------------------------------------------------------------------
// Lab 3 — Idempotent Seed Script
// Populates:
// 1. Categories (4 active)
// 2. Related Systems (7 active)
// 3. Users:
//    - Requesters (4 active, 1 inactive, 1 active with mustChangePassword: true)
//    - IT Staff (3 active, 1 inactive)
//    - Administrator (1 active)
// 4. Sample Tickets across statuses with itPriority, public comments, and internal notes
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
    // Requesters (>= 4 active, 1 inactive)
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

    // IT Staff (>= 3 active, 1 inactive)
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

    // Administrator (>= 1 active)
    {
      name: "System Administrator",
      email: "admin@toktickit.local",
      department: "IT Administration",
      role: "ADMINISTRATOR" as const,
      isActive: true,
      mustChangePassword: true,
    },
  ];

  const seededUsers: Record<string, any> = {};

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
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

  // 5. Seed Realistic Tickets
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
      ticketOwnerId: null,
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
      ticketOwnerId: seededUsers["alice.staff@toktickit.local"].id,
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
    },
  ];

  for (const t of sampleTickets) {
    const { comments, notes, ...ticketData } = t;
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
  }

  console.log(`Seeded ${sampleTickets.length} sample tickets with comments and notes.`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
