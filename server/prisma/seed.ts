import { getPrisma } from "../src/prisma.js";

// ---------------------------------------------------------------------------
// Lab 2 — Idempotent Seed Script
// Populates:
// 1. Categories (4 required)
// 2. Related Systems (7 systems)
// 3. Development Requesters (4 active, 1 inactive)
// ---------------------------------------------------------------------------

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

  // 3. Seed Development Requesters (4 active, 1 inactive)
  const requesters = [
    {
      name: "Jennifer Anderson",
      email: "jennifer.a@toktickit.local",
      department: "Human Resources",
      isActive: true,
    },
    {
      name: "David Lee",
      email: "david.l@toktickit.local",
      department: "Engineering",
      isActive: true,
    },
    {
      name: "Sarah Johnson",
      email: "sarah.j@toktickit.local",
      department: "Finance",
      isActive: true,
    },
    {
      name: "Michael Brown",
      email: "michael.b@toktickit.local",
      department: "Marketing",
      isActive: true,
    },
    {
      name: "Alex Wilson",
      email: "alex.w@toktickit.local",
      department: "Contractor",
      isActive: false, // Inactive requester
    },
  ];

  for (const req of requesters) {
    await prisma.requesterUser.upsert({
      where: { email: req.email },
      update: {
        name: req.name,
        department: req.department,
        isActive: req.isActive,
      },
      create: {
        name: req.name,
        email: req.email,
        department: req.department,
        isActive: req.isActive,
      },
    });
  }
  console.log(`Seeded ${requesters.length} development requesters (4 active, 1 inactive).`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
