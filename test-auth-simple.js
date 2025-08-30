// Simple FCL authentication test
const fcl = require("@onflow/fcl");

// Configure FCL with minimal settings
fcl.config({
  "accessNode.api": "https://rest-testnet.onflow.org",
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
  "app.detail.title": "Kaizen Test",
});

async function testBasicAuth() {
  console.log("🔄 Testing basic Flow authentication...");

  try {
    // Get current user without authentication
    const user = await fcl.currentUser().snapshot();
    console.log("📱 Current user state:", user ? "Connected" : "Disconnected");

    // Test basic blockchain connection
    const block = await fcl.latestBlock();
    console.log("✅ Flow blockchain connection successful");
    console.log(`📦 Latest block: ${block.height}`);
  } catch (error) {
    console.error("❌ Authentication test failed:", error.message);
  }
}

testBasicAuth();
