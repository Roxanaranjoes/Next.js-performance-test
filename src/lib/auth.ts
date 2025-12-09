import { SessionUser, UserRole } from "@/types";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { compare } from "bcryptjs";
import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Configure NextAuth to use Credentials with a JWT session.
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" }, // Use stateless JWT sessions.
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Short-circuit if the payload is incomplete.
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectDB(); // Ensure DB is ready before querying.
        const user = await User.findOne({ email: credentials.email });
        if (!user) {
          return null;
        }

        const passwordMatches = await compare(
          credentials.password,
          user.passwordHash
        );
        if (!passwordMatches) {
          return null;
        }

        // Only return safe fields to embed in the JWT.
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // When the user signs in, merge user info into the token.
      if (user) {
        token.id = (user as SessionUser).id;
        token.role = (user as SessionUser).role;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      // Copy token fields onto the session user for client access.
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.name = (token.name as string) || session.user.name;
        session.user.email = (token.email as string) || session.user.email;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", // Redirect unauthenticated users to the login page.
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Fetch the current server session user or null when not logged in.
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as SessionUser) ?? null;
}

// Small helper to check agent permissions in route handlers.
export function isAgent(user: SessionUser | null): boolean {
  return user?.role === "agent" || user?.role === "admin";
}

// Helper to check client permissions in route handlers.
export function isClient(user: SessionUser | null): boolean {
  return user?.role === "client";
}

// Helper to check admin permissions.
export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === "admin";
}
