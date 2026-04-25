import React from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

// Mock AuthContext
const MockAuthContext = React.createContext({
  user: null as any,
  session: null as any,
  isLoading: false,
  signUp: vi.fn().mockResolvedValue({ error: null }),
  signIn: vi.fn().mockResolvedValue({ error: null }),
  signOut: vi.fn(),
});

export function TestProviders({ children, user = null }: { children: React.ReactNode; user?: any }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MockAuthContext.Provider
          value={{
            user,
            session: user ? { access_token: "test" } : null,
            isLoading: false,
            signUp: vi.fn().mockResolvedValue({ error: null }),
            signIn: vi.fn().mockResolvedValue({ error: null }),
            signOut: vi.fn(),
          }}
        >
          <TooltipProvider>
            <BrowserRouter>{children}</BrowserRouter>
          </TooltipProvider>
        </MockAuthContext.Provider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export { MockAuthContext };
