'use client';

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { toastError, toastSuccess } from "@/lib/toast";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Must be inside a Suspense boundary.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

    // Delegate authentication to NextAuth credentials provider.
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
      toastError("Invalid email or password");
      return;
    }

    toastSuccess("Signed in successfully");
    router.push(result?.url || "/dashboard");
  };

  return (
    <div className="stack" style={{ maxWidth: 480, margin: "48px auto" }}>
      <div className="toolbar" style={{ padding: 0 }}>
        <div>
          <p className="pill">Access</p>
          <h1 className="page-title" style={{ marginBottom: 8 }}>
            Sign in
          </h1>
          <p className="lead">Enter your credentials to reach your dashboard.</p>
        </div>
      </div>

      <Card title="Welcome back" className="ghost-card">
        <form className="stack" onSubmit={handleSubmit}>
          <label>
            <div className="muted">Email</div>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
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
              placeholder="••••••••"
              required
            />
          </label>
          {error && (
            <div className="muted" style={{ color: "#b91c1c" }}>
              {error}
            </div>
          )}
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </form>
        <p style={{ marginTop: 12, textAlign: "center" }}>
          Don't have an account?{" "}
          <Link href="/register" className="nav-link" style={{ padding: 0 }}>
            Sign Up
          </Link>
        </p>
      </Card>
    </div>
  );
}

// Basic credentials login powered by NextAuth.
export default function LoginPage() {
  return (
    <Suspense fallback={<p className="muted">Loading...</p>}>
      <LoginForm />
    </Suspense>
  );
}
