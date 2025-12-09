'use client';

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAppContext } from "@/context/AppContext";
import { createTicket } from "@/lib/services/api";
import { toastError, toastSuccess } from "@/lib/toast";
import { TicketPriority } from "@/types";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

// Form for clients to submit a new ticket.
export default function NewTicketPage() {
  const router = useRouter();
  const { user, loadingUser, refreshTickets } = useAppContext();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await createTicket({ title, description, priority });
      if (res.error) {
        setError(res.error);
        toastError(res.error);
      } else {
        setSuccess("Ticket created successfully");
        toastSuccess("Ticket created successfully");
        await refreshTickets(); // Keep dashboard in sync.
        router.push("/dashboard");
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || "Unable to create ticket";
      setError(message);
      toastError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingUser) {
    return <p className="muted">Loading session...</p>;
  }

  if (!user) {
    return <p className="muted">You need to sign in to create a ticket.</p>;
  }

  if (user.role !== "client") {
    return <p className="muted">Only clients can create tickets.</p>;
  }

  return (
    <div className="stack" style={{ maxWidth: 720 }}>
      <div className="toolbar">
        <div>
          <p className="pill">Client workspace</p>
          <h1 className="page-title">New Ticket</h1>
          <p className="lead">Share clear details so the agent can resolve it faster.</p>
        </div>
      </div>

      <Card title="Ticket details" className="ghost-card">
        <form className="stack" onSubmit={handleSubmit}>
          <label>
            <div className="muted">Title</div>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Describe the issue"
              required
            />
          </label>
          <label>
            <div className="muted">Description</div>
            <textarea
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Add context so the agent can help quickly"
              required
            />
          </label>
          <label>
            <div className="muted">Priority</div>
            <select
              className="input"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          {error && (
            <div className="muted" style={{ color: "#b91c1c" }}>
              {error}
            </div>
          )}
          {success && (
            <div className="muted" style={{ color: "#166534" }}>
              {success}
            </div>
          )}
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "Submitting..." : "Create Ticket"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
