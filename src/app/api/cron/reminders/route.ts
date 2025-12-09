import { connectDB } from "@/lib/db";
import { sendAgentReminderEmail } from "@/lib/email";
import { Comment } from "@/lib/models/Comment";
import { Ticket } from "@/lib/models/Ticket";
import { User } from "@/lib/models/User";
import { NextRequest, NextResponse } from "next/server";

// Cron endpoint to remind agents about tickets with no agent reply after a delay.
export async function GET(req: NextRequest) {
  try {
    // Optional simple auth guard via header so only your scheduler can trigger it.
    const secret = process.env.CRON_SECRET;
    if (secret && req.headers.get("x-cron-secret") !== secret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h without agent reply.

    await connectDB();

    // Look for tickets that are still active and have not been touched recently.
    const tickets = await Ticket.find({
      status: { $in: ["open", "in_progress"] },
      updatedAt: { $lte: staleThreshold },
    }).lean();

    let processed = 0;
    let notified = 0;

    for (const ticket of tickets) {
      processed += 1;

      // Find the most recent comment to see if an agent has replied.
      const lastComment = await Comment.findOne({ ticketId: ticket._id })
        .sort({ createdAt: -1 })
        .lean();

      const hasAgentReply = lastComment?.authorRole === "agent";
      if (hasAgentReply) continue;

      if (!ticket.assignedTo) continue; // Only remind when an agent is assigned.

      const agent = await User.findById(ticket.assignedTo);
      if (!agent?.email) continue;

      await sendAgentReminderEmail(agent.email, ticket.title);
      notified += 1;
    }

    return NextResponse.json(
      {
        ok: true,
        summary: {
          scanned: processed,
          reminded: notified,
          windowHours: 24,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reminder cron failed", error);
    return NextResponse.json(
      { ok: false, error: "Reminder job failed" },
      { status: 500 }
    );
  }
}
