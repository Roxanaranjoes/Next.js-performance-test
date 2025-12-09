import { getSessionUser, isAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { UserRole } from "@/types";
import { NextRequest, NextResponse } from "next/server";

// Admin-only endpoint to update a user's role.
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

    if (!isAdmin(sessionUser)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const { role } = await req.json();
    const allowedRoles: UserRole[] = ["client", "agent", "admin"];
    // Prevent elevation to unsupported roles or typos.
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ ok: false, error: "Invalid role" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, fields: "name email role" }
    ).lean();

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to update user role", error);
    return NextResponse.json(
      { ok: false, error: "Unable to update user role" },
      { status: 500 }
    );
  }
}
