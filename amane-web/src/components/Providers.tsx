"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/lib/auth-store";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  const refreshUser = useAuthStore((s) => s.refreshUser);
  const hydrated = useAuthStore((s) => s.hydrated);

  // Une fois hydrate, on revalide le token aupres du backend
  useEffect(() => {
    if (hydrated) refreshUser();
  }, [hydrated, refreshUser]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={client}>
        {children}
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
