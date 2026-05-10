import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.upsert({
    where: {
      email: "demo@invoiceflow.local",
    },
    update: {
      name: "Demo User",
      passwordHash: "$2b$12$demoPasswordHashForLocalSeedData",
      plan: "FREE",
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
      name: "Demo User",
      plan: "FREE",
    },
  });

  await prisma.invoice.createMany({
    data: [
      {
        number: "INV-1001",
        userId: user.id,
        clientName: "Acme Studio",
        clientEmail: "billing@acmestudio.local",
        clientAddress: "100 Market Street, San Francisco, CA 94105",
        issueDate: new Date("2026-05-01T00:00:00.000Z"),
        dueDate: new Date("2026-05-15T00:00:00.000Z"),
        status: "SENT",
        currency: "USD",
        notes: "Payment due within 14 days.",
        subtotal: "1500.00",
        taxRate: "8.25",
        taxAmount: "123.75",
        total: "1623.75",
      },
      {
        number: "INV-1002",
        userId: user.id,
        clientName: "Northstar Labs",
        clientEmail: "accounts@northstarlabs.local",
        clientAddress: "42 Innovation Drive, Austin, TX 78701",
        issueDate: new Date("2026-05-05T00:00:00.000Z"),
        dueDate: new Date("2026-05-19T00:00:00.000Z"),
        status: "DRAFT",
        currency: "USD",
        notes: "Draft invoice for review.",
        subtotal: "2400.00",
        taxRate: "0.00",
        taxAmount: "0.00",
        total: "2400.00",
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
  const firstInvoiceId = invoiceIds.get("INV-1001");
  const secondInvoiceId = invoiceIds.get("INV-1002");

  if (!firstInvoiceId || !secondInvoiceId) {
    throw new Error("Seed invoices were not created.");
  }

  await prisma.lineItem.createMany({
    data: [
      {
        invoiceId: firstInvoiceId,
        description: "Invoice template setup",
        quantity: "1.00",
        unitPrice: "600.00",
        amount: "600.00",
      },
      {
        invoiceId: firstInvoiceId,
        description: "Billing workflow implementation",
        quantity: "3.00",
        unitPrice: "300.00",
        amount: "900.00",
      },
      {
        invoiceId: secondInvoiceId,
        description: "Proposal drafting",
        quantity: "4.00",
        unitPrice: "250.00",
        amount: "1000.00",
      },
      {
        invoiceId: secondInvoiceId,
        description: "Client portal planning",
        quantity: "7.00",
        unitPrice: "200.00",
        amount: "1400.00",
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
