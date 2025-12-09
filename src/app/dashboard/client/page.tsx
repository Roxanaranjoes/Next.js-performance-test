'use client';

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAppContext } from "@/context/AppContext";
import { toastError, toastInfo } from "@/lib/toast";
import { TicketDTO } from "@/types";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

// Client-only dashboard that lists the current user's tickets.
export default function ClientDashboardPage() {
  const { user, loadingUser, tickets, refreshTickets } = useAppContext();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  // Initial load of tickets for the signed-in client.
  useEffect(() => {
    if (loadingUser || user?.role !== "client") return;
    const load = async () => {
      setLoading(true);
      const error = await refreshTickets();
      if (error) {
        setFeedback(error);
        toastError(error);
      }
      setLoading(false);
    };
    load();
  }, [loadingUser, user, refreshTickets]);

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

  const metrics = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      resolved: tickets.filter((t) => t.status === "resolved").length,
      high: tickets.filter((t) => t.priority === "high").length,
    }),
    [tickets]
  );

  if (loadingUser) {
    return <p className="muted">Loading session...</p>;
  }

  if (!user) {
    return <p className="muted">You need to sign in to view the dashboard.</p>;
  }

  if (user.role !== "client") {
    return (
      <p className="muted">
        Agents should use the <Link href="/dashboard/agent">agent dashboard</Link>.
      </p>
    );
  }

  const statusBadges: Record<string, "default" | "amber" | "green" | "red" | "blue"> = {
    open: "blue",
    in_progress: "amber",
    resolved: "green",
    closed: "red",
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <div>
          <p className="pill">Client workspace</p>
          <h1 className="page-title">Client Panel</h1>
          <p className="lead">Create and track your support tickets.</p>
        </div>
        <div className="toolbar-actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Log Out
          </Button>
          <Link href="/tickets/new">
            <Button size="lg">New Ticket</Button>
          </Link>
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
          <p className="stat-label">Resolved</p>
          <p className="stat-value">{metrics.resolved}</p>
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
          <p className="muted" style={{ margin: 0, color: "#b91c1c" }}>
            {feedback}
          </p>
        </Card>
      )}

      {loading ? (
        <p className="muted">Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <Card>
          <p style={{ margin: 0 }}>No tickets yet. Create your first one.</p>
        </Card>
      ) : (
        <div className="ticket-grid">
          {tickets.map((ticket: TicketDTO) => (
            <Card
              key={ticket.id}
              title={ticket.title}
              actions={
                <Link href={`/tickets/${ticket.id}`}>
                  <Button variant="secondary" size="sm">View</Button>
                </Link>
              }
            >
              <p className="muted" style={{ marginTop: 0, marginBottom: 8 }}>
                {ticket.description}
              </p>
              <div className="ticket-meta">
                <Badge variant={statusBadges[ticket.status] || "default"}>
                  {ticket.status.replace("_", " ")}
                </Badge>
                <Badge variant={ticket.priority === "high" ? "red" : ticket.priority === "medium" ? "amber" : "green"}>
                  Priority: {ticket.priority}
                </Badge>
                {ticket.assignedTo ? <Badge variant="default">Assigned</Badge> : <Badge variant="default">Unassigned</Badge>}
                <Badge variant="default">
                  Created {new Date(ticket.createdAt).toLocaleDateString()}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
