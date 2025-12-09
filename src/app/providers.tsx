'use client';

import { AppProvider } from "@/context/AppContext";
import { SessionProvider } from "next-auth/react";
import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Wraps all client pages with NextAuth and app-level context.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppProvider>
        {children}
        <ToastContainer />
      </AppProvider>
    </SessionProvider>
  );
}
