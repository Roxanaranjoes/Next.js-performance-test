import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "HelpDeskPro",
  description: "Simple helpdesk ticketing app built with Next.js",
};

// Root layout shared by all routes.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <header>
            <nav className="nav-bar">
              <Link href="/dashboard" className="nav-brand">
                <span className="brand-mark">HD</span>
                <span>
                  <strong>HelpDeskPro</strong>
                  <div className="brand-sub">Support made simple</div>
                </span>
              </Link>
              <div className="nav-links">
                <Link className="nav-link" href="/dashboard">
                  Dashboard
                </Link>
                <Link className="nav-link" href="/tickets/new">
                  New Ticket
                </Link>
              </div>
              <div className="nav-actions">
                <Link className="nav-cta" href="/dashboard">
                  Go to app
                </Link>
              </div>
            </nav>
          </header>
          <main className="container">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
