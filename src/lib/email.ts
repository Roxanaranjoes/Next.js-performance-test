import nodemailer from "nodemailer";

// Basic transport that relies on SMTP env vars when available.
// Falls back to JSON transport to avoid throwing during local development.
function createTransport() {
  if (process.env.EMAIL_HOST && process.env.EMAIL_PORT && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Log emails to stdout when SMTP is not configured.
  return nodemailer.createTransport({
    jsonTransport: true,
  });
}

const transport = createTransport();
const defaultFrom = process.env.EMAIL_FROM || "no-reply@helpdeskpro.local";

async function sendEmail(to: string | undefined, subject: string, text: string) {
  if (!to) return; // Avoid sending without a recipient.

  try {
    await transport.sendMail({
      from: defaultFrom,
      to,
      subject,
      text,
    });
  } catch (error) {
    console.error("Failed to send email", error);
  }
}

export async function sendTicketCreatedEmail(to: string | undefined, title: string) {
  await sendEmail(
    to,
    "Ticket created",
    `Your ticket "${title}" was created successfully. Our team will review it shortly.`
  );
}

export async function sendAgentCommentEmail(to: string | undefined, title: string, agentName: string) {
  await sendEmail(
    to,
    "Ticket updated by agent",
    `${agentName} responded to your ticket "${title}". Sign in to review the reply.`
  );
}

export async function sendTicketClosedEmail(to: string | undefined, title: string) {
  await sendEmail(
    to,
    "Ticket closed",
    `Your ticket "${title}" has been marked as closed. Reply to reopen the conversation if needed.`
  );
}

export async function sendAgentReminderEmail(to: string | undefined, title: string) {
  await sendEmail(
    to,
    "Pending ticket reminder",
    `A ticket assigned to you ("${title}") has no agent reply yet. Please follow up with the client.`
  );
}
