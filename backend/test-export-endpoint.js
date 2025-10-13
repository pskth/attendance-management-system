const http = require("http");

async function testExportEndpoint() {
  console.log("Testing export endpoint...\n");

  return new Promise((resolve) => {
    // Test if we can reach the dump-info endpoint
    console.log("1. Testing dump-info endpoint (GET /api/admin/dump-info)...");

    const options = {
      hostname: "localhost",
      port: 4000,
      path: "/api/admin/dump-info",
      method: "GET",
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        console.log("✅ Response status:", res.statusCode);
        console.log("✅ Response:", data);
        console.log("\n2. Export-dump endpoint requires authentication");
        console.log("   Please test through the UI after logging in as admin");
        console.log("   Username: admin");
        console.log("   Password: admin123");
        console.log("\n3. Check browser console (F12) for frontend errors");
        console.log("   Look for CORS, network, or axios errors");
        resolve();
      });
    });

    req.on("error", (error) => {
      console.log("❌ Error:", error.message);
      console.log("   Is the backend running on port 4000?");
      resolve();
    });

    req.end();
  });
}

testExportEndpoint();
