// API configuration utility
// For auth endpoints, use Next.js API routes (always relative to the current domain)
// For other endpoints (like events), use the backend URL
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://flow-ing.onrender.com";

export const apiUrl = (endpoint: string) => {
  // Use Next.js API routes for auth and user endpoints to avoid CORS issues
  if (endpoint.includes('/api/login') || endpoint.includes('/api/register') || endpoint.includes('/api/users/me')) {
    // Return relative URL for Next.js API routes
    return endpoint;
  }
  // Use backend URL for other endpoints
  return `${API_BASE_URL}${endpoint}`;
};

export const imageUrl = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
};

// Generate FlowScan verification link for Flow blockchain
export const flowScanUrl = (
  accountId?: string,
  transactionHash?: string,
  network: "mainnet" | "testnet" = "testnet"
) => {
  const baseUrl = `https://${
    network === "mainnet" ? "" : "testnet."
  }flowscan.org`;

  if (transactionHash) {
    return `${baseUrl}/transaction/${transactionHash}`;
  }

  if (accountId) {
    return `${baseUrl}/account/${accountId}`;
  }

  return baseUrl;
};
