'use server';

import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

// Server-only redirector that routes users to the proper dashboard
// based on their role. Middleware already enforces authentication.
export default async function DashboardRedirectPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const target =
    session.user.role === "admin"
      ? "/dashboard/admin"
      : session.user.role === "agent"
      ? "/dashboard/agent"
      : "/dashboard/client";
  redirect(target);
}
