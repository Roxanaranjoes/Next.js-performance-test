'use client';

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAppContext } from "@/context/AppContext";
import { getUsers, updateUserRole } from "@/lib/services/api";
import { toastError, toastInfo, toastSuccess } from "@/lib/toast";
import { UserDTO } from "@/types";
import { signOut } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

type EditableRoles = Record<string, UserDTO["role"]>;

// Admin dashboard to promote/demote users between client/agent/admin.
export default function AdminDashboardPage() {
  const { user, loadingUser } = useAppContext();
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [edits, setEdits] = useState<EditableRoles>({});
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const metrics = useMemo(
    () => ({
      total: users.length,
      clients: users.filter((u) => u.role === "client").length,
      agents: users.filter((u) => u.role === "agent").length,
      admins: users.filter((u) => u.role === "admin").length,
    }),
    [users]
  );

  useEffect(() => {
    if (loadingUser || user?.role !== "admin") return;
    const load = async () => {
      setLoading(true);
      const res = await getUsers();
      if (res.data) {
        setUsers(res.data);
        const nextEdits: EditableRoles = {};
        res.data.forEach((u) => {
          nextEdits[u.id] = u.role;
        });
        setEdits(nextEdits);
      }
      setFeedback(res.error || "");
      if (res.error) {
        toastError(res.error);
      } else {
        toastInfo("Users synced");
      }
      setLoading(false);
    };
    load();
  }, [loadingUser, user]);

  const handleRoleChange = (userId: string, role: UserDTO["role"]) => {
    setEdits((prev) => ({ ...prev, [userId]: role }));
  };

  const handleSave = async (userId: string) => {
    const nextRole = edits[userId];
    if (!nextRole) return;
    setSavingId(userId);
    setFeedback("");
    const res = await updateUserRole(userId, nextRole);
    if (res.error || !res.data) {
      setFeedback(res.error || "Unable to update role");
      toastError(res.error || "Unable to update role");
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: res.data!.role } : u))
      );
      setFeedback("Role updated successfully");
      toastSuccess("Role updated successfully");
    }
    setSavingId(null);
  };

  if (loadingUser) {
    return <p className="muted">Loading session...</p>;
  }

  if (!user || user.role !== "admin") {
    return <p className="muted">Only admins can manage roles.</p>;
  }

  return (
    <div className="stack">
      <div className="toolbar">
        <div>
          <p className="pill">Admin</p>
          <h1 className="page-title">Role management</h1>
          <p className="lead">Promote agents and keep roles aligned with responsibilities.</p>
        </div>
        <div className="toolbar-actions">
          <Button variant="secondary" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
            Log Out
          </Button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <p className="stat-label">Total users</p>
          <p className="stat-value">{metrics.total}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Clients</p>
          <p className="stat-value">{metrics.clients}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Agents</p>
          <p className="stat-value">{metrics.agents}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Admins</p>
          <p className="stat-value">{metrics.admins}</p>
        </div>
      </div>

      <Card title="Users" className="ghost-card">
        {feedback && (
          <p
            className="muted"
            style={{ marginTop: 0, color: feedback.includes("success") ? "#166534" : "#b91c1c" }}
          >
            {feedback}
          </p>
        )}

        {loading ? (
          <p className="muted">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="muted">No users found.</p>
        ) : (
          <div className="stack">
            {users.map((u) => (
              <Card key={u.id}>
                <div className="ticket-meta" style={{ justifyContent: "space-between" }}>
                  <div>
                    <strong>{u.name}</strong>
                    <p className="muted" style={{ margin: "4px 0 0" }}>
                      {u.email}
                    </p>
                  </div>
                  <Badge variant={u.role === "admin" ? "red" : u.role === "agent" ? "blue" : "default"}>
                    {u.role}
                  </Badge>
                </div>
                <div className="filters-grid" style={{ marginTop: 12 }}>
                  <label>
                    <div className="muted">Role</div>
                    <select
                      className="input"
                      value={edits[u.id] || u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserDTO["role"])}
                      disabled={savingId === u.id}
                    >
                      <option value="client">Client</option>
                      <option value="agent">Agent</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSave(u.id)}
                    disabled={savingId === u.id}
                  >
                    {savingId === u.id ? "Saving..." : "Save role"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
