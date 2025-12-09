"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toastError, toastSuccess } from "@/lib/toast";

// Registration form aligned with the login UX.
export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!name || !email || !password) {
      setError("All fields are required.");
      toastError("All fields are required.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        toastSuccess("Account created. Please sign in.");
        router.push("/login");
      } else {
        const data = await res.json();
        setError(data.message || "Error registering user.");
        toastError(data.message || "Error registering user.");
      }
    } catch (err) {
      setError("An error occurred on the server.");
      toastError("Server error while creating account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack" style={{ maxWidth: 520, margin: "48px auto" }}>
      <div className="toolbar" style={{ padding: 0 }}>
        <div>
          <p className="pill">Access</p>
          <h1 className="page-title" style={{ marginBottom: 8 }}>
            Create account
          </h1>
          <p className="lead">Set up your credentials to open and track tickets.</p>
        </div>
      </div>

      <Card title="Register" className="ghost-card">
        <form className="stack" onSubmit={handleRegister}>
          <label>
            <div className="muted">Full name</div>
            <input
              className="input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Smith"
              disabled={loading}
              required
            />
          </label>
          <label>
            <div className="muted">Email</div>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
              required
            />
          </label>
          <label>
            <div className="muted">Password</div>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              disabled={loading}
              required
            />
          </label>
          {error && (
            <div className="muted" style={{ color: "#b91c1c" }}>
              {error}
            </div>
          )}
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </Button>
        </form>
        <p style={{ marginTop: 12, textAlign: "center" }}>
          Already have an account?{" "}
          <Link href="/login" className="nav-link" style={{ padding: 0 }}>
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
