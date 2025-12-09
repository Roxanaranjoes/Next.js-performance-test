import { getSessionUser, isAgent } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { sendAgentCommentEmail } from "@/lib/email";
import { Comment } from "@/lib/models/Comment";
import { Ticket } from "@/lib/models/Ticket";
import { User } from "@/lib/models/User";
import { validateCommentInput } from "@/lib/validators";
import { CommentDTO } from "@/types";
import { NextRequest, NextResponse } from "next/server";

// Convert a comment document into a client-friendly DTO.
function toCommentDTO(comment: any): CommentDTO {
  return {
    id: comment._id.toString(),
    ticketId: comment.ticketId?.toString?.() || "",
    authorId: comment.authorId?.toString?.() || "",
    authorName: comment.authorName,
    authorRole: comment.authorRole,
    message: comment.message,
    createdAt: comment.createdAt?.toISOString?.() || new Date().toISOString(),
    updatedAt: comment.updatedAt?.toISOString?.() || new Date().toISOString(),
  };
}

// Ensure the requester can read/write the given ticket.
async function validateTicketAccess(
  ticketId: string,
  userId: string,
  isAgentUser: boolean
) {
  const ticket = await Ticket.findById(ticketId);

  if (!ticket) {
    return { ticket: null, error: "Ticket not found", status: 404 };
  }

  if (!isAgentUser && ticket.createdBy.toString() !== userId) {
    return { ticket: null, error: "Forbidden", status: 403 };
  }

  return { ticket, error: null, status: 200 };
}

// List comments for a ticket in chronological order.
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

    const access = await validateTicketAccess(id, sessionUser.id, isAgent(sessionUser));
    if (access.error) {
      return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
    }

    const comments = await Comment.find({ ticketId: id })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json(
      { ok: true, data: comments.map(toCommentDTO) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to list comments", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load comments" },
      { status: 500 }
    );
  }
}

// Add a new comment to a ticket from either the client or the agent.
export async function POST(
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
    const validation = validateCommentInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        { ok: false, error: validation.error },
        { status: 400 }
      );
    }

    await connectDB();

    const access = await validateTicketAccess(id, sessionUser.id, isAgent(sessionUser));
    if (access.error || !access.ticket) {
      return NextResponse.json(
        { ok: false, error: access.error },
        { status: access.status }
      );
    }

    const comment = await Comment.create({
      ticketId: access.ticket._id,
      authorId: sessionUser.id,
      authorName: sessionUser.name,
      authorRole: sessionUser.role,
      message: body.message,
    });

    // Notify the client when an agent responds.
    if (isAgent(sessionUser)) {
      const client = await User.findById(access.ticket.createdBy);
      await sendAgentCommentEmail(client?.email, access.ticket.title, sessionUser.name);
    }

    return NextResponse.json(
      { ok: true, data: toCommentDTO(comment) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to add comment", error);
    return NextResponse.json(
      { ok: false, error: "Unable to add comment" },
      { status: 500 }
    );
  }
}
