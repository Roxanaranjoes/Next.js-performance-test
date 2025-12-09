// Shared type definitions for both client and server code.
export type UserRole = "client" | "agent" | "admin";

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export type TicketPriority = "low" | "medium" | "high";

// Minimal user shape that is safe to expose to the client.
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Basic user shape for admin management.
export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Ticket shape returned by API routes.
export interface TicketDTO {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

// Comment shape returned by API routes.
export interface CommentDTO {
  id: string;
  ticketId: string;
  authorId: string;
  authorName?: string;
  authorRole?: UserRole;
  message: string;
  createdAt: string;
  updatedAt: string;
}
