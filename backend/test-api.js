import fetch from "node-fetch";

async function testAPI() {
  try {
    console.log("🧪 Testing API endpoints...");

    // Test health endpoint
    const healthResponse = await fetch("http://localhost:4000/api/health");
    const healthData = await healthResponse.json();
    console.log("✅ Health check:", healthData);

    // Test users endpoint
    const usersResponse = await fetch("http://localhost:4000/api/users");
    const usersData = await usersResponse.json();
    console.log(
      "✅ Users endpoint:",
      Array.isArray(usersData) ? `${usersData.length} users found` : usersData
    );

    // Test events endpoint
    const eventsResponse = await fetch("http://localhost:4000/api/events");
    const eventsData = await eventsResponse.json();
    console.log(
      "✅ Events endpoint:",
      Array.isArray(eventsData)
        ? `${eventsData.length} events found`
        : eventsData
    );

    console.log("🎉 All API tests passed!");
  } catch (error) {
    console.error("❌ API test failed:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.error("💡 Server might not be running on port 4000");
    }
  }
}

testAPI();
