'use client';

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAppContext } from "@/context/AppContext";
import { AgentDTO, createComment, getAgents, getCommentsByTicket, getTicketById, updateTicket } from "@/lib/services/api";
import { toastError, toastSuccess } from "@/lib/toast";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CommentDTO, TicketDTO } from "@/types";

// Keep comments consistently ordered from oldest to newest.
const sortCommentsChronologically = (items: CommentDTO[]) =>
  [...items].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

// Ticket detail page with status management and comments.
export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const ticketId = useMemo(() => params?.id, [params]);

  const { user, loadingUser, refreshTickets } = useAppContext();

  const [ticket, setTicket] = useState<TicketDTO | null>(null);
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState("medium");
  const [assignedTo, setAssignedTo] = useState<string | undefined>(undefined);
  const [newComment, setNewComment] = useState("");
  const [agents, setAgents] = useState<AgentDTO[]>([]);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Load ticket details, comments, and agent list when applicable.
  useEffect(() => {
    if (!ticketId || loadingUser || !user) return;

    const load = async () => {
      setLoading(true);
      setPageError("");
      setFormError("");
      try {
        // Load the core ticket document first.
        const ticketRes = await getTicketById(ticketId);
        if (ticketRes.error || !ticketRes.data) {
          setPageError(ticketRes.error || "Unable to load ticket");
          return;
        }

        setTicket(ticketRes.data);
        setTitle(ticketRes.data.title);
        setDescription(ticketRes.data.description);
        setStatus(ticketRes.data.status);
        setPriority(ticketRes.data.priority);
        setAssignedTo(ticketRes.data.assignedTo);

        // Then fetch existing comments to show the conversation.
        const commentRes = await getCommentsByTicket(ticketId);
        if (commentRes.data) setComments(sortCommentsChronologically(commentRes.data));
        if (commentRes.error) setFormError(commentRes.error);
        if (commentRes.error) toastError(commentRes.error);

        if (user.role === "agent") {
          const agentsRes = await getAgents();
          if (agentsRes.data) setAgents(agentsRes.data);
          if (agentsRes.error) setFormError(agentsRes.error);
          if (agentsRes.error) toastError(agentsRes.error);
        }
      } catch (err: any) {
        const message = err?.response?.data?.error || "Unable to load ticket";
        setPageError(message);
        toastError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [ticketId, user, loadingUser]);

  const handleUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!ticketId) return;
    setFormError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const payload: Record<string, any> =
        user?.role === "agent"
          ? { title, description, status, priority, assignedTo }
          : { title, description };

      const res = await updateTicket(ticketId, payload);

      if (res.error || !res.data) {
        setFormError(res.error || "Update failed");
        toastError(res.error || "Update failed");
      } else {
        setTicket(res.data);
        setTitle(res.data.title);
        setDescription(res.data.description);
        setStatus(res.data.status);
        setPriority(res.data.priority);
        setAssignedTo(res.data.assignedTo);
        setSuccessMessage("Ticket updated successfully");
        toastSuccess("Ticket updated successfully");
        await refreshTickets(); // Keep dashboard data fresh.
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || "Update failed";
      setFormError(message);
      toastError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ticketId || !newComment.trim()) return;
    setFormError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const res = await createComment(ticketId, { message: newComment });
      if (res.error || !res.data) {
        setFormError(res.error || "Unable to add comment");
        toastError(res.error || "Unable to add comment");
      } else {
        setComments((prev) =>
          sortCommentsChronologically([...prev, res.data as CommentDTO])
        );
        setNewComment("");
        setSuccessMessage("Comment posted");
        toastSuccess("Comment posted");
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || "Unable to add comment";
      setFormError(message);
      toastError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingUser) {
    return <p className="muted">Loading session...</p>;
  }

  if (!user) {
    return <p className="muted">You need to sign in to view this ticket.</p>;
  }

  if (pageError) {
    return <p className="muted">{pageError}</p>;
  }

  if (!ticket) {
    return <p className="muted">Loading ticket...</p>;
  }

  const canEditText =
    user.role === "agent" || (user.role === "client" && ticket.status === "open");

  const statusVariant =
    ticket.status === "resolved"
      ? "green"
      : ticket.status === "in_progress"
      ? "amber"
      : ticket.status === "closed"
      ? "red"
      : "blue";

  return (
    <div className="stack">
      <div className="toolbar">
        <div>
          <p className="pill">Ticket detail</p>
          <h1 className="page-title">{ticket.title}</h1>
          <p className="lead">
            Keep the client updated and move the ticket through the right status.
          </p>
        </div>
        <div className="toolbar-actions">
          <Badge variant={statusVariant}>{ticket.status.replace("_", " ")}</Badge>
          <Badge variant={ticket.priority === "high" ? "red" : ticket.priority === "medium" ? "amber" : "green"}>
            Priority: {ticket.priority}
          </Badge>
          {ticket.assignedTo && <Badge variant="default">Assigned</Badge>}
        </div>
      </div>

      <div className="ticket-meta" style={{ gap: 10 }}>
        <span className="pill">Created {new Date(ticket.createdAt).toLocaleString()}</span>
        <span className="pill">Updated {new Date(ticket.updatedAt).toLocaleString()}</span>
      </div>

      <Card title="Details" className="ghost-card">
        <p style={{ marginTop: 0 }}>{ticket.description}</p>
        {ticket.assignedTo && (
          <p className="muted">
            Assigned to:{" "}
            {agents.find((a) => a.id === ticket.assignedTo)?.name ||
              ticket.assignedTo}
          </p>
        )}
      </Card>

      <Card title="Edit ticket">
        <form className="stack" onSubmit={handleUpdate}>
          <label>
            <div className="muted">Title</div>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canEditText || loading}
            />
          </label>
          <label>
            <div className="muted">Description</div>
            <textarea
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              disabled={!canEditText || loading}
            />
          </label>

          {user.role === "agent" && (
            <>
              <div className="filters-grid">
                <label>
                  <div className="muted">Status</div>
                  <select
                    className="input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={loading}
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
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    disabled={loading}
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
                    value={assignedTo || ""}
                    onChange={(e) => setAssignedTo(e.target.value || undefined)}
                    disabled={loading}
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
            </>
          )}

          {formError && (
            <div className="muted" style={{ color: "#b91c1c" }}>
              {formError}
            </div>
          )}
          {successMessage && (
            <div className="muted" style={{ color: "#166534" }}>
              {successMessage}
            </div>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </Card>

      <Card title="Comments">
        <div className="stack">
          {comments.length === 0 ? (
            <p className="muted">No comments yet.</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="comment-bubble">
                <p style={{ margin: "0 0 6px" }}>{comment.message}</p>
                <p className="comment-meta">
                  {(comment.authorName || "User")} • {new Date(comment.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>

        <form className="stack" onSubmit={handleCommentSubmit} style={{ marginTop: 16 }}>
          <label>
            <div className="muted">Add comment</div>
            <textarea
              className="input"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              placeholder="Share an update"
              disabled={loading}
            />
          </label>
          <Button type="submit" disabled={loading || !newComment.trim()}>
            {loading ? "Posting..." : "Post comment"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
