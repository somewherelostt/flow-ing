"use client";

import * as fcl from "@onflow/fcl";

// Client-side only FCL initialization to prevent SSR issues
let initialized = false;

export const initializeFlowClient = () => {
  if (typeof window === "undefined" || initialized) {
    return;
  }

  try {
    // Flow configuration for client-side only
    const flowConfig = {
      "accessNode.api":
        process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE ||
        "https://rest-testnet.onflow.org",
      "discovery.wallet":
        process.env.NEXT_PUBLIC_FLOW_WALLET_DISCOVERY ||
        "https://fcl-discovery.onflow.org/testnet/authn",
      "app.detail.title": "Kaizen - Flow Event Platform",
      "app.detail.icon": "https://kaizen-x-delta.vercel.app/kaizen-logo.svg",
      "service.OpenID.scopes": "email",
      "walletconnect.projectId":
        process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
        "2f5a1b1c8b4a3d9e7f6c8d9e0f1a2b3c",
      "fcl.limit": 9999,
      "fcl.eventPollRate": 2500,
    };

    fcl.config(flowConfig);
    initialized = true;
    console.log("Flow client initialized successfully");
  } catch (error) {
    console.error("Error initializing Flow client:", error);
  }
};

// Auto-initialize on client-side
if (typeof window !== "undefined") {
  initializeFlowClient();
}
