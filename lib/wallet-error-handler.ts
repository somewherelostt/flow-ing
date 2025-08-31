"use client";

// Global error handler for wallet extension errors
export const setupWalletErrorHandler = () => {
  if (typeof window === "undefined") return;

  // Store original console.error to avoid infinite loops
  const originalConsoleError = console.error;

  // Override console.error to filter out wallet extension errors
  console.error = (...args) => {
    const message = args.join(" ");

    // Filter out specific wallet extension errors
    if (
      message.includes("Error checking default wallet status: {}") ||
      message.includes("pageProvider.js") ||
      message.includes("chrome-extension") ||
      (args[0] &&
        typeof args[0] === "string" &&
        args[0].includes("Error checking default wallet status"))
    ) {
      // Suppress this specific error from appearing in console
      return;
    }

    // For all other errors, use original console.error
    originalConsoleError.apply(console, args);
  };

  // Handle unhandled promise rejections from wallet extensions
  window.addEventListener("unhandledrejection", (event) => {
    // Check if error is from wallet extension
    if (
      event.reason &&
      typeof event.reason === "object" &&
      (event.reason.message?.includes("wallet") ||
        event.reason.message?.includes("default wallet status") ||
        event.reason.stack?.includes("pageProvider.js") ||
        event.reason.stack?.includes("chrome-extension"))
    ) {
      console.warn(
        "Wallet extension error caught and suppressed:",
        event.reason
      );
      event.preventDefault(); // Prevent the error from appearing in console
    }
  });

  // Handle window errors from extensions
  window.addEventListener("error", (event) => {
    if (
      event.filename?.includes("chrome-extension") ||
      event.message?.includes("wallet") ||
      event.message?.includes("default wallet status") ||
      event.message?.includes("pageProvider.js")
    ) {
      console.warn(
        "Browser extension error caught and suppressed:",
        event.message
      );
      event.preventDefault();
    }
  });

  console.log("Wallet error handler setup complete");
};

// Auto-setup on client-side
if (typeof window !== "undefined") {
  setupWalletErrorHandler();
}
