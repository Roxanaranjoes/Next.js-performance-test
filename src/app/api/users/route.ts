import { getSessionUser, isAgent, isAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { NextResponse } from "next/server";

// List all users for agents so they can assign tickets.
export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!isAgent(sessionUser) && !isAdmin(sessionUser)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB(); // Ensure DB is connected before querying.
    const query = isAdmin(sessionUser) ? {} : { role: "agent" };
    const users = await User.find(query, "name email role").lean();

    return NextResponse.json(
      {
        ok: true,
        data: users.map((user) => ({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to list users", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load users" },
      { status: 500 }
    );
  }
}
