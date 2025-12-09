import { getSessionUser, isAgent } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { sendTicketCreatedEmail } from "@/lib/email";
import { Ticket } from "@/lib/models/Ticket";
import { validateTicketInput } from "@/lib/validators";
import { TicketDTO, TicketPriority, TicketStatus } from "@/types";
import { NextRequest, NextResponse } from "next/server";

// Convert a Mongoose ticket document into a serializable DTO for API responses.
function toTicketDTO(ticket: any): TicketDTO {
  return {
    id: ticket._id.toString(),
    title: ticket.title,
    description: ticket.description,
    status: ticket.status as TicketStatus,
    priority: ticket.priority as TicketPriority,
    createdBy: ticket.createdBy?.toString?.() || "",
    assignedTo: ticket.assignedTo?.toString?.(),
    imageUrl: ticket.imageUrl,
    createdAt: ticket.createdAt?.toISOString?.() || new Date().toISOString(),
    updatedAt: ticket.updatedAt?.toISOString?.() || new Date().toISOString(),
  };
}

// Create a new ticket for a client user.
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!isAgent(sessionUser) && sessionUser.role !== "client") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    // Only clients should create tickets.
    if (sessionUser.role !== "client") {
      return NextResponse.json({ ok: false, error: "Clients only" }, { status: 403 });
    }

    const body = await req.json();
    const validation = validateTicketInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        { ok: false, error: validation.error },
        { status: 400 }
      );
    }

    await connectDB();

    // Normalize the priority to a safe default.
    const priority: TicketPriority = ["low", "medium", "high"].includes(
      body.priority
    )
      ? body.priority
      : "medium";

    const ticket = await Ticket.create({
      title: body.title,
      description: body.description,
      priority,
      createdBy: sessionUser.id,
      imageUrl: body.imageUrl,
    });

    // Fire-and-forget notification for the client.
    await sendTicketCreatedEmail(sessionUser.email, ticket.title);

    return NextResponse.json({ ok: true, data: toTicketDTO(ticket) }, { status: 201 });
  } catch (error) {
    console.error("Failed to create ticket", error);
    return NextResponse.json(
      { ok: false, error: "Unable to create ticket" },
      { status: 500 }
    );
  }
}

// List tickets based on the current user's role and filters.
export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    await connectDB();

    const query: Record<string, any> = {};

    if (!isAgent(sessionUser)) {
      query.createdBy = sessionUser.id; // Clients only see their own tickets.
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    const tickets = await Ticket.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json(
      { ok: true, data: tickets.map(toTicketDTO) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to list tickets", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load tickets" },
      { status: 500 }
    );
  }
}
