import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import { sendProposalEmail } from "../services/emailService";
import { escapeHtml } from "../services/pdfService";
import { HttpError } from "../utils/httpError";

const proposalStatusSchema = z.enum(["DRAFT", "SENT", "ACCEPTED", "DECLINED"]);

const createProposalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Valid client email is required"),
  content: z.string().min(1, "Proposal content is required"),
});

const updateProposalSchema = createProposalSchema.partial().extend({
  status: proposalStatusSchema.optional(),
});

const updateStatusSchema = z.object({
  status: proposalStatusSchema,
});

const getRouteId = (req: Request) => {
  const id = req.params.id;

  if (Array.isArray(id)) {
    return id[0];
  }

  if (!id) {
    throw new HttpError(400, "Proposal id is required");
  }

  return id;
};

const getZodMessage = (error: z.ZodError) =>
  error.issues[0]?.message ?? "Validation failed";

const getProposalForUser = async (id: string, userId: string) => {
  const proposal = await prisma.proposal.findFirst({
    where: { id, userId },
  });

  if (!proposal) {
    throw new HttpError(404, "Proposal not found");
  }

  return proposal;
};

const generateInvoiceNumber = async (userId: string) => {
  const lastInvoice = await prisma.invoice.findFirst({
    where: { userId },
    orderBy: { number: "desc" },
  });

  if (!lastInvoice) {
    return "INV-001";
  }

  const lastNumber = Number.parseInt(lastInvoice.number.split("-")[1] ?? "0", 10);
  return `INV-${String(lastNumber + 1).padStart(3, "0")}`;
};

const renderMarkdown = (content: string) => {
  const lines = content.split(/\r?\n/);
  const html: string[] = [];
  let listOpen = false;

  const closeList = () => {
    if (listOpen) {
      html.push("</ul>");
      listOpen = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      closeList();
      html.push(`<h3>${escapeHtml(trimmed.slice(4))}</h3>`);
      continue;
    }

    if (trimmed.startsWith("## ")) {
      closeList();
      html.push(`<h2>${escapeHtml(trimmed.slice(3))}</h2>`);
      continue;
    }

    if (trimmed.startsWith("# ")) {
      closeList();
      html.push(`<h1>${escapeHtml(trimmed.slice(2))}</h1>`);
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${escapeHtml(trimmed.slice(2))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${escapeHtml(trimmed)}</p>`);
  }

  closeList();
  return html.join("");
};

const renderPublicProposalHtml = (proposal: Awaited<ReturnType<typeof prisma.proposal.findUnique>>) => {
  if (!proposal) {
    throw new HttpError(404, "Proposal not found");
  }

  const statusLabel = proposal.status.toLowerCase();

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(proposal.title)}</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; background: #f8fafc; color: #0f172a; font-family: Inter, "Segoe UI", Arial, sans-serif; line-height: 1.6; }
      main { min-height: 100vh; padding: 40px 20px; }
      .proposal { max-width: 840px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
      .header { padding: 32px; border-bottom: 1px solid #e2e8f0; }
      .eyebrow { margin: 0 0 10px; color: #0f766e; font-size: 13px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
      h1 { margin: 0; font-size: 34px; line-height: 1.2; letter-spacing: 0; }
      .meta { margin-top: 16px; color: #475569; }
      .status { display: inline-flex; margin-top: 18px; border: 1px solid #cbd5e1; border-radius: 999px; padding: 4px 10px; color: #334155; font-size: 13px; font-weight: 700; text-transform: capitalize; }
      .content { padding: 32px; }
      .content h1, .content h2, .content h3 { margin: 28px 0 10px; letter-spacing: 0; }
      .content h1:first-child, .content h2:first-child, .content h3:first-child { margin-top: 0; }
      .content p { margin: 0 0 16px; }
      .content ul { margin: 0 0 18px 22px; padding: 0; }
      .actions { display: flex; gap: 12px; padding: 24px 32px 32px; border-top: 1px solid #e2e8f0; }
      button { border: 0; border-radius: 6px; cursor: pointer; font-weight: 800; padding: 12px 18px; }
      button:disabled { cursor: not-allowed; opacity: .65; }
      .accept { background: #0f766e; color: #ffffff; }
      .decline { background: #f1f5f9; color: #334155; }
      .message { padding: 0 32px 24px; color: #475569; font-size: 14px; }
      @media (max-width: 640px) {
        main { padding: 20px 12px; }
        .header, .content, .actions { padding-left: 20px; padding-right: 20px; }
        h1 { font-size: 28px; }
        .actions { flex-direction: column; }
      }
    </style>
  </head>
  <body>
    <main>
      <article class="proposal">
        <header class="header">
          <p class="eyebrow">Proposal</p>
          <h1>${escapeHtml(proposal.title)}</h1>
          <div class="meta">
            Prepared for <strong>${escapeHtml(proposal.clientName)}</strong>
          </div>
          <span class="status" id="status">${escapeHtml(statusLabel)}</span>
        </header>
        <section class="content">${renderMarkdown(proposal.content)}</section>
        <div class="actions">
          <button class="accept" type="button" data-status="ACCEPTED">Accept</button>
          <button class="decline" type="button" data-status="DECLINED">Decline</button>
        </div>
        <div class="message" id="message"></div>
      </article>
    </main>
    <script>
      const buttons = Array.from(document.querySelectorAll("[data-status]"));
      const message = document.getElementById("message");
      const statusBadge = document.getElementById("status");

      buttons.forEach((button) => {
        button.addEventListener("click", async () => {
          buttons.forEach((item) => item.disabled = true);
          message.textContent = "Updating proposal...";

          try {
            const response = await fetch(window.location.pathname.replace(/\\/view$/, "/status"), {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: button.dataset.status })
            });

            if (!response.ok) {
              throw new Error("Status update failed");
            }

            const proposal = await response.json();
            statusBadge.textContent = proposal.status.toLowerCase();
            message.textContent = proposal.status === "ACCEPTED"
              ? "Proposal accepted. The sender has been notified in their workspace."
              : "Proposal declined. The sender has been notified in their workspace.";
          } catch (error) {
            buttons.forEach((item) => item.disabled = false);
            message.textContent = "The proposal status could not be updated. Please try again.";
          }
        });
      });
    </script>
  </body>
</html>`;
};

export const getProposals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const proposals = await prisma.proposal.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });

    res.json(proposals);
  } catch (error) {
    next(error);
  }
};

export const createProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createProposalSchema.parse(req.body);
    const proposal = await prisma.proposal.create({
      data: {
        ...data,
        userId: req.user!.id,
        status: "DRAFT",
      },
    });

    res.status(201).json(proposal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new HttpError(400, getZodMessage(error)));
      return;
    }

    next(error);
  }
};

export const getProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const proposal = await getProposalForUser(getRouteId(req), req.user!.id);
    res.json(proposal);
  } catch (error) {
    next(error);
  }
};

export const updateProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getRouteId(req);
    await getProposalForUser(id, req.user!.id);

    const data = updateProposalSchema.parse(req.body);
    const proposal = await prisma.proposal.update({
      where: { id },
      data,
    });

    res.json(proposal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new HttpError(400, getZodMessage(error)));
      return;
    }

    next(error);
  }
};

export const deleteProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getRouteId(req);
    await getProposalForUser(id, req.user!.id);
    await prisma.proposal.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const sendProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getRouteId(req);
    await sendProposalEmail(id, req.user!.id);

    const proposal = await prisma.proposal.update({
      where: { id },
      data: { status: "SENT" },
    });

    res.json(proposal);
  } catch (error) {
    next(error);
  }
};

export const updateProposalStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getRouteId(req);
    const { status } = updateStatusSchema.parse(req.body);

    if (req.user) {
      await getProposalForUser(id, req.user.id);
    } else if (status !== "ACCEPTED" && status !== "DECLINED") {
      throw new HttpError(401, "Authorization token is required.");
    }

    const proposal = await prisma.proposal.update({
      where: { id },
      data: { status },
    });

    res.json(proposal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new HttpError(400, getZodMessage(error)));
      return;
    }

    next(error);
  }
};

export const convertProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const proposal = await getProposalForUser(getRouteId(req), req.user!.id);

    if (proposal.status !== "ACCEPTED") {
      throw new HttpError(400, "Only accepted proposals can be converted to an invoice");
    }

    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 30);

    const invoiceNumber = await generateInvoiceNumber(req.user!.id);
    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        userId: req.user!.id,
        clientName: proposal.clientName,
        clientEmail: proposal.clientEmail,
        clientAddress: "",
        issueDate: now,
        dueDate,
        currency: "USD",
        notes: proposal.content,
        subtotal: 0,
        taxRate: 0,
        taxAmount: 0,
        total: 0,
        status: "DRAFT",
        lineItems: {
          create: {
            description: proposal.title,
            quantity: 1,
            unitPrice: 0,
            amount: 0,
          },
        },
      },
      select: { id: true },
    });

    res.status(201).json({ invoiceId: invoice.id });
  } catch (error) {
    next(error);
  }
};

export const viewPublicProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: getRouteId(req) },
    });

    const html = renderPublicProposalHtml(proposal);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    );
    res.send(html);
  } catch (error) {
    next(error);
  }
};
