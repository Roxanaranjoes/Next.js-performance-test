'use client';

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAppContext } from "@/context/AppContext";
import { AgentDTO, getAgents, updateTicket } from "@/lib/services/api";
import { toastError, toastInfo, toastSuccess } from "@/lib/toast";
import { TicketDTO, TicketPriority, TicketStatus } from "@/types";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type TicketEditState = Record<
  string,
  { status: TicketStatus; priority: TicketPriority; assignedTo?: string }
>;

// Agent dashboard with filters and inline ticket updates.
export default function AgentDashboardPage() {
  const { user, loadingUser, tickets, refreshTickets } = useAppContext();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [agents, setAgents] = useState<AgentDTO[]>([]);
  const [edits, setEdits] = useState<TicketEditState>({});
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Prepare an edit snapshot whenever tickets refresh.
  useEffect(() => {
    const nextState: TicketEditState = {};
    tickets.forEach((ticket) => {
      nextState[ticket.id] = {
        status: ticket.status,
        priority: ticket.priority,
        assignedTo: ticket.assignedTo,
      };
    });
    setEdits(nextState);
  }, [tickets]);

  // Load tickets and agent list once the agent session is ready.
  useEffect(() => {
    if (loadingUser || user?.role !== "agent") return;
    const load = async () => {
      setLoading(true);
      const ticketError = await refreshTickets();
      const agentsRes = await getAgents();
      if (agentsRes.data) setAgents(agentsRes.data);
      setFeedback(ticketError || agentsRes.error || "");
      if (ticketError || agentsRes.error) {
        toastError(ticketError || agentsRes.error || "Unable to load data");
      }
      setLoading(false);
    };
    load();
  }, [loadingUser, user, refreshTickets]);

  const statusBadges: Record<string, "default" | "amber" | "green" | "red" | "blue"> = {
    open: "blue",
    in_progress: "amber",
    resolved: "green",
    closed: "red",
  };

  const filteredTickets = useMemo(() => tickets, [tickets]);

  const metrics = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      inProgress: tickets.filter((t) => t.status === "in_progress").length,
      high: tickets.filter((t) => t.priority === "high").length,
    }),
    [tickets]
  );

  const handleFilterChange = async (status: string, priority: string) => {
    setStatusFilter(status);
    setPriorityFilter(priority);
    setLoading(true);
    const error = await refreshTickets({
      status: status || undefined,
      priority: priority || undefined,
    });
    setFeedback(error || "");
    if (error) {
      toastError(error);
    } else {
      toastInfo("Filters applied");
    }
    setLoading(false);
  };

  const handleEditChange = (ticketId: string, key: keyof TicketEditState[string], value: string) => {
    setEdits((prev) => ({
      ...prev,
      [ticketId]: {
        ...prev[ticketId],
        [key]: value,
      },
    }));
  };

  const handleQuickUpdate = async (ticketId: string) => {
    const payload = edits[ticketId];
    if (!payload) return;
    setActionLoadingId(ticketId);
    setFeedback("");

    const { error } = await updateTicket(ticketId, {
      status: payload.status,
      priority: payload.priority,
      assignedTo: payload.assignedTo || undefined,
    });

    if (error) {
      setFeedback(error);
      toastError(error);
    } else {
      const reloadError = await refreshTickets({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setFeedback(reloadError || "Ticket updated successfully");
      if (reloadError) {
        toastError(reloadError);
      } else {
        toastSuccess("Ticket updated successfully");
      }
    }

    setActionLoadingId(null);
  };

  if (loadingUser) {
    return <p className="muted">Loading session...</p>;
  }

  if (!user) {
    return <p className="muted">You need to sign in to view the dashboard.</p>;
  }

  if (user.role !== "agent") {
    return (
      <p className="muted">
        Clients should use the <Link href="/dashboard/client">client dashboard</Link>.
      </p>
    );
  }

  return (
    <div className="stack">
      <div className="toolbar">
        <div>
          <p className="pill">Agent workspace</p>
          <h1 className="page-title">Agent Panel</h1>
          <p className="lead">Review, assign, and resolve incoming tickets.</p>
        </div>
        <div className="toolbar-actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Log Out
          </Button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <p className="stat-label">Total</p>
          <p className="stat-value">{metrics.total}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Open</p>
          <p className="stat-value">{metrics.open}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">In progress</p>
          <p className="stat-value">{metrics.inProgress}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">High priority</p>
          <p className="stat-value">{metrics.high}</p>
        </div>
      </div>

      <Card title="Filters" className="ghost-card">
        <div className="filters-grid">
          <label>
            <div className="muted">Status</div>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => handleFilterChange(e.target.value, priorityFilter)}
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </label>
          <label>
            <div className="muted">Priority</div>
            <select
              className="input"
              value={priorityFilter}
              onChange={(e) => handleFilterChange(statusFilter, e.target.value)}
            >
              <option value="">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>
      </Card>

      {feedback && (
        <Card>
          <p className="muted" style={{ margin: 0, color: feedback.includes("successfully") ? "#166534" : "#b91c1c" }}>
            {feedback}
          </p>
        </Card>
      )}

      {loading ? (
        <p className="muted">Loading tickets...</p>
      ) : filteredTickets.length === 0 ? (
        <Card>
          <p style={{ margin: 0 }}>No tickets found for this filter.</p>
        </Card>
      ) : (
        <div className="ticket-grid">
          {filteredTickets.map((ticket: TicketDTO) => (
            <Card
              key={ticket.id}
              title={ticket.title}
              actions={
                <Link href={`/tickets/${ticket.id}`}>
                  <Button variant="secondary" size="sm">View</Button>
                </Link>
              }
            >
              <p className="muted" style={{ marginTop: 0, marginBottom: 10 }}>
                {ticket.description}
              </p>
              <div className="ticket-meta" style={{ marginBottom: 12 }}>
                <Badge variant={statusBadges[ticket.status] || "default"}>
                  {ticket.status.replace("_", " ")}
                </Badge>
                <Badge variant={ticket.priority === "high" ? "red" : ticket.priority === "medium" ? "amber" : "green"}>
                  Priority: {ticket.priority}
                </Badge>
                <Badge variant="default">
                  Created {new Date(ticket.createdAt).toLocaleDateString()}
                </Badge>
                {ticket.assignedTo ? <Badge variant="blue">Assigned</Badge> : <Badge variant="default">Unassigned</Badge>}
              </div>

              <div className="filters-grid">
                <label>
                  <div className="muted">Status</div>
                  <select
                    className="input"
                    value={edits[ticket.id]?.status || ticket.status}
                    onChange={(e) => handleEditChange(ticket.id, "status", e.target.value)}
                    disabled={actionLoadingId === ticket.id}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </label>
                <label>
                  <div className="muted">Priority</div>
                  <select
                    className="input"
                    value={edits[ticket.id]?.priority || ticket.priority}
                    onChange={(e) => handleEditChange(ticket.id, "priority", e.target.value)}
                    disabled={actionLoadingId === ticket.id}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
                <label>
                  <div className="muted">Assign to</div>
                  <select
                    className="input"
                    value={edits[ticket.id]?.assignedTo || ""}
                    onChange={(e) => handleEditChange(ticket.id, "assignedTo", e.target.value)}
                    disabled={actionLoadingId === ticket.id}
                  >
                    <option value="">Unassigned</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, gap: 8 }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleQuickUpdate(ticket.id)}
                  disabled={actionLoadingId === ticket.id}
                >
                  {actionLoadingId === ticket.id ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
