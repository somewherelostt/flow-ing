"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import * as fcl from "@onflow/fcl";
import { getUserFlowBalance } from "@/lib/flow";
import { initializeFlowClient } from "@/lib/flow-client";

interface FlowWalletState {
  isConnected: boolean;
  walletName: string;
  address: string;
  balance: string;
  isLoading: boolean;
  error: string | null;
  user: any;
}

interface FlowWalletContextType extends FlowWalletState {
  connectWallet: () => Promise<boolean>;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
}

const FlowWalletContext = createContext<FlowWalletContextType | undefined>(
  undefined
);

export function useFlowWallet() {
  const context = useContext(FlowWalletContext);
  if (context === undefined) {
    throw new Error("useFlowWallet must be used within a FlowWalletProvider");
  }
  return context;
}

interface FlowWalletProviderProps {
  children: ReactNode;
}

export function FlowWalletProvider({ children }: FlowWalletProviderProps) {
  const [walletState, setWalletState] = useState<FlowWalletState>({
    isConnected: false,
    walletName: "",
    address: "",
    balance: "0",
    isLoading: false,
    error: null,
    user: null,
  });

  // Initialize Flow client on mount
  useEffect(() => {
    initializeFlowClient();
  }, []);

  // Subscribe to FCL user changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = fcl.currentUser.subscribe((user: any) => {
        try {
          if (user?.loggedIn) {
            setWalletState((prev: FlowWalletState) => ({
              ...prev,
              isConnected: true,
              address: user.addr || "",
              user: user,
              walletName: getWalletName(user),
              error: null,
            }));
            // Fetch balance when user connects
            fetchBalance(user.addr);
          } else {
            setWalletState((prev: FlowWalletState) => ({
              ...prev,
              isConnected: false,
              address: "",
              balance: "0",
              user: null,
              walletName: "",
              error: null,
            }));
          }
        } catch (error) {
          console.error("Error in user subscription callback:", error);
          setWalletState((prev: FlowWalletState) => ({
            ...prev,
            error: "Failed to process wallet state",
          }));
        }
      });
    } catch (error) {
      console.error("Error setting up user subscription:", error);
      setWalletState((prev: FlowWalletState) => ({
        ...prev,
        error: "Failed to initialize wallet connection",
      }));
    }

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing from user changes:", error);
        }
      }
    };
  }, []);

  const getWalletName = (user: any): string => {
    // Determine wallet name based on user services or other identifiers
    if (user?.services) {
      const service = user.services[0];
      if (service?.uid?.includes("blocto")) return "Blocto";
      if (service?.uid?.includes("lilico")) return "Lilico";
      if (service?.uid?.includes("dapper")) return "Dapper";
      if (service?.uid?.includes("ledger")) return "Ledger";
      if (service?.uid?.includes("finoa")) return "Finoa";
    }
    return "Flow Wallet";
  };

  const fetchBalance = async (address: string) => {
    if (!address) return;

    try {
      setWalletState((prev: FlowWalletState) => ({ ...prev, isLoading: true }));
      const balance = await getUserFlowBalance(address);
      setWalletState((prev: FlowWalletState) => ({
        ...prev,
        balance: balance.toFixed(8),
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      console.error("Error fetching balance:", error);
      setWalletState((prev: FlowWalletState) => ({
        ...prev,
        balance: "0.00",
        isLoading: false,
        error: "Failed to fetch balance",
      }));
    }
  };

  const connectWallet = async (): Promise<boolean> => {
    setWalletState((prev: FlowWalletState) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      // Use FCL to authenticate user with better error handling
      console.log("Starting wallet authentication...");

      // Clear any existing authentication first
      try {
        const currentUserSnapshot = await fcl.currentUser().snapshot();
        if (currentUserSnapshot?.loggedIn) {
          await fcl.unauthenticate();
        }
      } catch (error) {
        console.warn("Warning clearing existing authentication:", error);
        // Continue with authentication even if clearing fails
      }

      await fcl.authenticate();
      console.log("Authentication completed successfully");

      return true;
    } catch (error: any) {
      console.error("Wallet connection error:", error);

      let errorMessage = "Failed to connect wallet";

      // Handle specific error types
      if (
        error.message?.includes("declined") ||
        error.message?.includes("rejected") ||
        error.message?.includes("denied") ||
        error.message?.includes("User rejected")
      ) {
        errorMessage =
          "Wallet connection was rejected. Please try again and approve the connection.";
      } else if (error.message?.includes("nonce")) {
        errorMessage = "Authentication error. Please try connecting again.";
      } else if (error.message?.includes("account proof")) {
        errorMessage = "Account verification failed. Please try again.";
      } else if (error.message?.includes("No services")) {
        errorMessage =
          "No wallet services available. Please install a Flow wallet extension.";
      } else if (error.message?.includes("timeout")) {
        errorMessage = "Connection timed out. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setWalletState((prev: FlowWalletState) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      return false;
    }
  };

  const disconnectWallet = () => {
    // Use FCL to unauthenticate user
    fcl.unauthenticate();

    setWalletState({
      isConnected: false,
      walletName: "",
      address: "",
      balance: "0",
      isLoading: false,
      error: null,
      user: null,
    });
  };

  const refreshBalance = async () => {
    if (walletState.address) {
      await fetchBalance(walletState.address);
    }
  };

  const contextValue: FlowWalletContextType = {
    ...walletState,
    connectWallet,
    disconnectWallet,
    refreshBalance,
  };

  return (
    <FlowWalletContext.Provider value={contextValue}>
      {children}
    </FlowWalletContext.Provider>
  );
}
