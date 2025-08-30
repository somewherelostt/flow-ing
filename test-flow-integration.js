// Test Flow integration
const fcl = require("@onflow/fcl");

// Configure FCL for testing
fcl.config({
  "accessNode.api": "https://rest-testnet.onflow.org",
});

async function testFlowConnection() {
  console.log("🔄 Testing Flow blockchain connection...");

  try {
    // Test basic connection
    const latestBlock = await fcl.latestBlock(true);
    console.log("✅ Connected to Flow blockchain!");
    console.log(`📦 Latest block height: ${latestBlock.height}`);
    console.log(
      `🕒 Block timestamp: ${new Date(
        parseInt(latestBlock.timestamp) / 1000000
      ).toISOString()}`
    );

    // Test account query (Flow service account)
    const serviceAccount = await fcl.account("0xf8d6e0586b0a20c7");
    console.log("✅ Successfully queried Flow service account");
    console.log(`💰 Service account balance: ${serviceAccount.balance} FLOW`);
  } catch (error) {
    console.error("❌ Flow connection test failed:", error.message);
  }
}

testFlowConnection();
