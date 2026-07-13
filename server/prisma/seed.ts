import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.upsert({
    where: {
      email: "demo@invoiceflow.local",
    },
    update: {
      name: "Alex Vance",
      businessName: "Horizon Digital Inc.",
      passwordHash: "$2b$12$demoPasswordHashForLocalSeedData",
      plan: "PRO",
      stripeCustomerId: null,
      invoices: {
        deleteMany: {},
      },
      proposals: {
        deleteMany: {},
      },
    },
    create: {
      email: "demo@invoiceflow.local",
      passwordHash: "$2b$12$demoPasswordHashForLocalSeedData",
      name: "Alex Vance",
      businessName: "Horizon Digital Inc.",
      plan: "PRO",
    },
  });

  await prisma.invoice.createMany({
    data: [
      {
        number: "INV-2026-042",
        userId: user.id,
        clientName: "Aura Dynamics Ltd.",
        clientEmail: "accounts@auradynamics.dev",
        clientAddress: "770 Broadway, New York, NY 10003",
        issueDate: new Date("2026-06-10T00:00:00.000Z"),
        dueDate: new Date("2026-06-24T00:00:00.000Z"),
        status: "PAID",
        currency: "USD",
        notes: "Payment secured via wire transfer. Thank you for your business.",
        subtotal: 57500,
        taxRate: 0,
        taxAmount: 0,
        total: 57500,
      },
      {
        number: "INV-2026-043",
        userId: user.id,
        clientName: "Quantum Inc.",
        clientEmail: "finance@quantum.ai",
        clientAddress: "1200 Innovation Way, Palo Alto, CA 94301",
        issueDate: new Date("2026-07-01T00:00:00.000Z"),
        dueDate: new Date("2026-07-15T00:00:00.000Z"),
        status: "SENT",
        currency: "USD",
        notes: "Due on receipt. Please initiate ACH transfer.",
        subtotal: 125000,
        taxRate: 8.5,
        taxAmount: 10625,
        total: 135625,
      },
      {
        number: "INV-2026-044",
        userId: user.id,
        clientName: "Nexus Ventures",
        clientEmail: "billing@nexusvc.com",
        clientAddress: "One World Trade Center, New York, NY 10007",
        issueDate: new Date("2026-07-10T00:00:00.000Z"),
        dueDate: new Date("2026-08-10T00:00:00.000Z"),
        status: "DRAFT",
        currency: "USD",
        notes: "Draft invoice for Q3 Retainer.",
        subtotal: 45000,
        taxRate: 0,
        taxAmount: 0,
        total: 45000,
      },
    ],
  });

  const invoices = await prisma.invoice.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      number: true,
    },
  });

  const invoiceIds = new Map(invoices.map((invoice) => [invoice.number, invoice.id]));
  const inv1 = invoiceIds.get("INV-2026-042");
  const inv2 = invoiceIds.get("INV-2026-043");
  const inv3 = invoiceIds.get("INV-2026-044");

  if (!inv1 || !inv2 || !inv3) {
    throw new Error("Seed invoices were not created.");
  }

  await prisma.lineItem.createMany({
    data: [
      {
        invoiceId: inv1,
        description: "Enterprise Infrastructure Setup",
        quantity: 1,
        unitPrice: 45000,
        amount: 45000,
      },
      {
        invoiceId: inv1,
        description: "Annual Maintenance Contract",
        quantity: 1,
        unitPrice: 12500,
        amount: 12500,
      },
      {
        invoiceId: inv2,
        description: "Data Warehouse Migration Phase 1",
        quantity: 1,
        unitPrice: 85000,
        amount: 85000,
      },
      {
        invoiceId: inv2,
        description: "Machine Learning Pipeline Optimization",
        quantity: 2,
        unitPrice: 20000,
        amount: 40000,
      },
      {
        invoiceId: inv3,
        description: "Q3 Strategic Advisory Retainer",
        quantity: 3,
        unitPrice: 15000,
        amount: 45000,
      },
    ],
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
