import { getSessionUser, isAgent } from "@/lib/auth";
import { sendTicketClosedEmail } from "@/lib/email";
import { connectDB } from "@/lib/db";
import { Ticket } from "@/lib/models/Ticket";
import { User } from "@/lib/models/User";
import { validateTicketUpdate } from "@/lib/validators";
import { TicketDTO, TicketPriority, TicketStatus } from "@/types";
import { NextRequest, NextResponse } from "next/server";

// Transform a ticket document into a clean JSON-friendly DTO.
function toTicketDTO(ticket: any): TicketDTO {
  return {
    id: ticket._id.toString(),
    title: ticket.title,
    description: ticket.description,
    status: ticket.status as TicketStatus,
    priority: ticket.priority as TicketPriority,
    createdBy: ticket.createdBy?.toString?.() || "",
    assignedTo: ticket.assignedTo?.toString?.(),
    createdAt: ticket.createdAt?.toISOString?.() || new Date().toISOString(),
    updatedAt: ticket.updatedAt?.toISOString?.() || new Date().toISOString(),
  };
}

// Fetch a single ticket with permission checks.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const ticket = await Ticket.findById(id).lean();

    if (!ticket) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    if (!isAgent(sessionUser) && ticket.createdBy.toString() !== sessionUser.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ ok: true, data: toTicketDTO(ticket) }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch ticket", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load ticket" },
      { status: 500 }
    );
  }
}

// Update ticket fields according to role rules.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    await connectDB();
    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    if (!isAgent(sessionUser) && ticket.createdBy.toString() !== sessionUser.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const validation = validateTicketUpdate(body, sessionUser.role, ticket.status);
    if (!validation.valid) {
      const status =
        validation.error && validation.error.toLowerCase().includes("client")
          ? 403
          : 400;
      return NextResponse.json({ ok: false, error: validation.error }, { status });
    }

    const previousStatus = ticket.status;

    // Apply only the allowed fields.
    if (body.title) ticket.title = body.title;
    if (body.description) ticket.description = body.description;

    if (isAgent(sessionUser)) {
      // Agents may adjust status, priority, and assignment.
      if (body.status && ["open", "in_progress", "resolved", "closed"].includes(body.status)) {
        ticket.status = body.status;
      }

      if (body.priority && ["low", "medium", "high"].includes(body.priority)) {
        ticket.priority = body.priority;
      }

      if (Object.prototype.hasOwnProperty.call(body, "assignedTo")) {
        ticket.assignedTo = body.assignedTo || undefined;
      }
    }

    await ticket.save();

    // Notify the client if the ticket transitions to closed.
    if (previousStatus !== "closed" && ticket.status === "closed") {
      const client = await User.findById(ticket.createdBy);
      await sendTicketClosedEmail(client?.email, ticket.title);
    }

    return NextResponse.json({ ok: true, data: toTicketDTO(ticket) }, { status: 200 });
  } catch (error) {
    console.error("Failed to update ticket", error);
    return NextResponse.json(
      { ok: false, error: "Unable to update ticket" },
      { status: 500 }
    );
  }
}

// Delete a ticket (agent only).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!isAgent(sessionUser)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const ticket = await Ticket.findByIdAndDelete(id);

    if (!ticket) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: toTicketDTO(ticket) }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete ticket", error);
    return NextResponse.json(
      { ok: false, error: "Unable to delete ticket" },
      { status: 500 }
    );
  }
}
