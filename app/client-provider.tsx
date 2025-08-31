"use client";

import { useEffect } from "react";
import { setupWalletErrorHandler } from "@/lib/wallet-error-handler";

interface ClientProviderProps {
  children: React.ReactNode;
}

export function ClientProvider({ children }: ClientProviderProps) {
  useEffect(() => {
    // Setup wallet error handlers on client-side
    setupWalletErrorHandler();
  }, []);

  return <>{children}</>;
}
