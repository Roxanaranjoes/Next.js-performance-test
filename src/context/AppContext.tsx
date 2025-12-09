'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { SessionUser, TicketDTO } from '@/types';
import { useSession } from 'next-auth/react';
import { getTickets } from '@/lib/services/api';

interface AppContextValue {
  user: SessionUser | null;
  loadingUser: boolean;
  tickets: TicketDTO[];
  setTickets: React.Dispatch<React.SetStateAction<TicketDTO[]>>;
  refreshTickets: (filters?: { status?: string; priority?: string }) => Promise<string | undefined>;
}

// Provide a small global store so dashboards can share the signed-in user and cached tickets.
const AppContext = createContext<AppContextValue>({
  user: null,
  loadingUser: true,
  tickets: [],
  setTickets: () => undefined,
  refreshTickets: async () => undefined,
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const user = (session?.user as SessionUser) ?? null;
  const loadingUser = status === 'loading';

  const [tickets, setTickets] = useState<TicketDTO[]>([]);

  // Fetch tickets and store them in context so dashboard can reuse them.
  const refreshTickets = useCallback(
    async (filters?: { status?: string; priority?: string }) => {
      // Avoid calling APIs when there is no authenticated user.
      if (!user) return 'No active session';

      const { data, error } = await getTickets(filters);
      if (data) {
        setTickets(data);
      }
      return error;
    },
    [user] // Re-run when the session user changes.
  );

  return (
    <AppContext.Provider value={{ user, loadingUser, tickets, setTickets, refreshTickets }}>
      {children}
    </AppContext.Provider>
  );
}

// Convenience hook for components.
export function useAppContext() {
  return useContext(AppContext);
}
