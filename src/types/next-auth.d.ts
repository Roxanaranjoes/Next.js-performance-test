import { SessionUser, UserRole } from "@/types";
import NextAuth, { DefaultSession } from "next-auth";

// Extend NextAuth types so the session carries our custom user fields.
declare module "next-auth" {
  interface Session {
    user: SessionUser & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
    name: string;
    email: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    name: string;
    email: string;
  }
}
