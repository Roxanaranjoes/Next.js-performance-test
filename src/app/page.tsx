import { redirect } from "next/navigation";

// Redirect root to dashboard for convenience.
export default function HomePage() {
  redirect("/dashboard");
}
