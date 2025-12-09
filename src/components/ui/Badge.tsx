import React from "react";

type BadgeVariant = "default" | "green" | "amber" | "red" | "blue";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

// Lightweight badge for statuses and priorities.
export function Badge({ variant = "default", children }: BadgeProps) {
  const styles: Record<BadgeVariant, React.CSSProperties> = {
    default: { background: "#eef2ff", color: "#1e3a8a", borderColor: "#c7d2fe" },
    green: { background: "#ecfdf3", color: "#166534", borderColor: "#bbf7d0" },
    amber: { background: "#fffbeb", color: "#92400e", borderColor: "#fcd34d" },
    red: { background: "#fef2f2", color: "#991b1b", borderColor: "#fecdd3" },
    blue: { background: "#e0f2fe", color: "#0c4a6e", borderColor: "#7dd3fc" },
  };

  return (
    <span className="badge" style={styles[variant]}>
      {children}
    </span>
  );
}
