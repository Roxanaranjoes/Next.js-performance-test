// Centralized, typed API client used by dashboards and ticket pages.
import axios, { AxiosError } from "axios";
import { CommentDTO, TicketDTO, TicketPriority, TicketStatus, UserDTO } from "@/types";

// Configure a shared Axios instance with credentials for session-based APIs.
const api = axios.create({
  withCredentials: true,
});

// Normalize Axios errors into user-friendly strings so UI can toast them.
function parseAxiosError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as any)?.error ||
      (error.response?.data as any)?.message ||
      error.message ||
      "Unexpected request error"
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected request error";
}

export interface ServiceResponse<T> {
  data?: T;
  error?: string;
}

// Ticket list with optional filters depending on the user's role.
export async function getTickets(filters?: {
  status?: TicketStatus | string;
  priority?: TicketPriority | string;
}): Promise<ServiceResponse<TicketDTO[]>> {
  try {
    const res = await api.get("/api/tickets", { params: filters });
    return { data: res.data.data as TicketDTO[] };
  } catch (error) {
    return { data: [], error: parseAxiosError(error) };
  }
}

export async function getTicketById(id: string): Promise<ServiceResponse<TicketDTO>> {
  try {
    const res = await api.get(`/api/tickets/${id}`);
    return { data: res.data.data as TicketDTO };
  } catch (error) {
    return { error: parseAxiosError(error) };
  }
}

// Create a new ticket (client-only route).
export async function createTicket(payload: {
  title: string;
  description: string;
  priority: TicketPriority;
}): Promise<ServiceResponse<TicketDTO>> {
  try {
    const res = await api.post("/api/tickets", payload);
    return { data: res.data.data as TicketDTO };
  } catch (error) {
    return { error: parseAxiosError(error) };
  }
}

export async function updateTicket(
  id: string,
  payload: Partial<{
    title: string;
    description: string;
    status: TicketStatus;
    priority: TicketPriority;
    assignedTo: string | undefined;
  }>
): Promise<ServiceResponse<TicketDTO>> {
  try {
    const res = await api.patch(`/api/tickets/${id}`, payload);
    return { data: res.data.data as TicketDTO };
  } catch (error) {
    return { error: parseAxiosError(error) };
  }
}

export async function getCommentsByTicket(ticketId: string): Promise<ServiceResponse<CommentDTO[]>> {
  try {
    const res = await api.get(`/api/tickets/${ticketId}/comments`);
    return { data: res.data.data as CommentDTO[] };
  } catch (error) {
    return { data: [], error: parseAxiosError(error) };
  }
}

export async function createComment(
  ticketId: string,
  payload: { message: string }
): Promise<ServiceResponse<CommentDTO>> {
  try {
    const res = await api.post(`/api/tickets/${ticketId}/comments`, payload);
    return { data: res.data.data as CommentDTO };
  } catch (error) {
    return { error: parseAxiosError(error) };
  }
}

export interface AgentDTO {
  id: string;
  name: string;
  email: string;
  role: "agent";
}

// Fetch only agent users so assignment controls have options.
export async function getAgents(): Promise<ServiceResponse<AgentDTO[]>> {
  try {
    const res = await api.get("/api/users");
    const agents = (res.data.data as AgentDTO[]).filter((user) => user.role === "agent");
    return { data: agents };
  } catch (error) {
    return { data: [], error: parseAxiosError(error) };
  }
}

export async function getUsers(): Promise<ServiceResponse<UserDTO[]>> {
  try {
    const res = await api.get("/api/users");
    return { data: res.data.data as UserDTO[] };
  } catch (error) {
    return { data: [], error: parseAxiosError(error) };
  }
}

export async function updateUserRole(
  userId: string,
  role: "client" | "agent" | "admin"
): Promise<ServiceResponse<UserDTO>> {
  try {
    const res = await api.patch(`/api/users/${userId}`, { role });
    return { data: res.data.data as UserDTO };
  } catch (error) {
    return { error: parseAxiosError(error) };
  }
}
