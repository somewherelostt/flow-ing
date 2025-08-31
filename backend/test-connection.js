import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, ".env"),
  debug: true,
});

const dbUrl = process.env.DB_URL || process.env.DATABASE_URL;

console.log("🧪 MongoDB Connection Test");
console.log("==========================");
console.log("Environment:", process.env.NODE_ENV || "not set");
console.log("DB URL available:", !!dbUrl);
console.log(
  "Connection string preview:",
  dbUrl ? dbUrl.substring(0, 30) + "..." : "NOT SET"
);

if (!dbUrl) {
  console.error("❌ No database URL found!");
  process.exit(1);
}

// Test different connection configurations
async function testConnection() {
  console.log("\n🔍 Testing MongoDB connection...");

  const timeout = setTimeout(() => {
    console.error("⏰ Connection test timed out after 15 seconds");
    process.exit(1);
  }, 15000);

  try {
    // First, try with minimal options
    console.log("📡 Attempting connection with optimized settings...");

    await mongoose.connect(dbUrl, {
      ssl: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      maxPoolSize: 5,
      retryWrites: true,
      retryReads: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: false,
    });

    clearTimeout(timeout);
    console.log("✅ Connection successful!");
    console.log("📊 Connection details:");
    console.log("  - Database:", mongoose.connection.db.databaseName);
    console.log("  - Ready state:", mongoose.connection.readyState);
    console.log("  - Host:", mongoose.connection.host);

    // Test a simple operation
    console.log("\n🧪 Testing database operation...");
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      "📋 Collections found:",
      collections.map((c) => c.name)
    );

    console.log("\n✅ All tests passed! Your MongoDB connection is working.");
  } catch (error) {
    clearTimeout(timeout);
    console.error("❌ Connection failed:");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);

    if (error.message.includes("SSL") || error.message.includes("TLS")) {
      console.error("\n🔒 SSL/TLS Error Diagnostics:");
      console.error("This error typically occurs due to:");
      console.error("1. Network/firewall issues blocking SSL connections");
      console.error("2. Outdated Node.js or MongoDB driver versions");
      console.error("3. Corporate proxy or network restrictions");
      console.error("4. MongoDB Atlas cluster configuration issues");

      console.error("\n💡 Suggested fixes:");
      console.error("1. Try connecting from a different network");
      console.error("2. Check if your IP is whitelisted in MongoDB Atlas");
      console.error("3. Verify cluster is active and healthy");
      console.error("4. Try using MongoDB Compass to test connection");
      console.error("5. Consider using alternative connection string format");

      // Try alternative connection string
      console.error("\n🔄 Trying alternative connection approach...");
      try {
        const alternativeUrl = dbUrl.replace("mongodb+srv://", "mongodb://");
        await mongoose.connect(alternativeUrl, {
          ssl: true,
          tlsAllowInvalidCertificates: true,
          serverSelectionTimeoutMS: 5000,
        });
        console.log("✅ Alternative connection method worked!");
      } catch (altError) {
        console.error("❌ Alternative approach also failed:", altError.message);
      }
    }

    if (
      error.message.includes("ENOTFOUND") ||
      error.message.includes("getaddrinfo")
    ) {
      console.error("\n🌐 DNS Resolution Error:");
      console.error("Cannot resolve MongoDB Atlas hostname");
      console.error("Check your internet connection and DNS settings");
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("🔌 Connection closed");
    }
    process.exit(0);
  }
}

testConnection();
