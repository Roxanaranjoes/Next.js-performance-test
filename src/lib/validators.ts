import { TicketPriority, TicketStatus, UserRole } from "@/types";

// Generic validation response to keep API handlers small.
interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Validate payload used during user registration.
export function validateRegisterInput(body: any): ValidationResult {
  if (!body?.name || !body?.email || !body?.password) {
    return { valid: false, error: "Name, email, and password are required" };
  }
  return { valid: true };
}

// Ensure tickets are created with the essential fields (image is optional).
export function validateTicketInput(body: any): ValidationResult {
  if (!body?.title?.toString?.().trim() || !body?.description?.toString?.().trim()) {
    return { valid: false, error: "Title and description are required" };
  }
  return { valid: true };
}

// Require a comment message to avoid empty threads.
export function validateCommentInput(body: any): ValidationResult {
  if (!body?.message?.toString?.().trim()) {
    return { valid: false, error: "Message is required" };
  }
  return { valid: true };
}

// Validate which fields are editable depending on role and current status.
export function validateTicketUpdate(
  body: any,
  role: UserRole,
  currentStatus: TicketStatus
): ValidationResult {
  // Agents and admins can adjust the main workflow fields.
  if (role === "agent" || role === "admin") {
    return { valid: true }; // Agents can adjust managed fields freely.
  }

  // Clients can only change text while the ticket is open.
  if (role === "client" && currentStatus !== "open") {
    return { valid: false, error: "Clients can only edit open tickets" };
  }

  const allowed = body.title || body.description || body.imageUrl;
  if (!allowed) {
    return { valid: false, error: "Nothing to update" };
  }

  if (body.status || body.priority || body.assignedTo) {
    return { valid: false, error: "Clients cannot change status or assignment" };
  }

  return { valid: true };
}
