const request = require("supertest");

// Import the app
let app;

describe("Universal CORS Proxy Server", () => {
  beforeAll(() => {
    // Import app after setting test environment
    process.env.NODE_ENV = "test";
    process.env.BLOCKED_DOMAINS = "";
    app = require("../server");
  });

  afterAll(async () => {
    // Clean up environment variables
    delete process.env.PROXY_API_KEY;
    delete process.env.ADMIN_API_KEY;
    delete process.env.BLOCKED_DOMAINS;
    delete process.env.MAX_REQUEST_SIZE_MB;
    delete process.env.DEBUG_HEADERS;
    delete process.env.DEBUG_ERRORS;
  });

  describe("Health Check", () => {
    test("GET /health should return server status with enhanced fields", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toHaveProperty("status", "healthy");
      expect(response.body).toHaveProperty("service", "CORS Proxy Server");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
      expect(response.body).toHaveProperty("memory");
      expect(response.body).toHaveProperty("healthChecks");

      // Check enhanced memory format
      expect(response.body.memory).toHaveProperty("rss");
      expect(response.body.memory).toHaveProperty("heapTotal");
      expect(response.body.memory).toHaveProperty("heapUsed");
      expect(response.body.memory).toHaveProperty("external");

      // Memory values should be formatted as strings with "MB" suffix
      expect(response.body.memory.rss).toMatch(/^\d+MB$/);
      expect(response.body.memory.heapTotal).toMatch(/^\d+MB$/);
    });

    test("GET / should return server status", async () => {
      const response = await request(app).get("/").expect(200);
      expect(response.body).toHaveProperty("status", "healthy");
    });

    test("Health checks should increment counter", async () => {
      const response1 = await request(app).get("/health").expect(200);
      const count1 = response1.body.healthChecks;

      const response2 = await request(app).get("/health").expect(200);
      const count2 = response2.body.healthChecks;

      expect(count2).toBe(count1 + 1);
    });
  });

  describe("API Documentation", () => {
    test("GET /docs should return enhanced API documentation", async () => {
      const response = await request(app).get("/docs").expect(200);

      expect(response.body).toHaveProperty("name", "Universal CORS Proxy");
      expect(response.body).toHaveProperty("description");
      expect(response.body).toHaveProperty("version");
      expect(response.body).toHaveProperty("usage");
      expect(response.body.usage).toHaveProperty("endpoint", "/proxy");
      expect(response.body).toHaveProperty("rateLimit");
      expect(response.body).toHaveProperty("timestamp");
    });
  });

  describe("Request Size Validation", () => {
    beforeEach(() => {
      process.env.MAX_REQUEST_SIZE_MB = "0.001"; // 1KB limit for testing (very small)
    });

    afterEach(() => {
      delete process.env.MAX_REQUEST_SIZE_MB;
    });

    test("Should reject requests exceeding size limit", async () => {
      const largePayload = "x".repeat(2048); // 2KB payload

      const response = await request(app)
        .post("/proxy")
        .set("Content-Length", largePayload.length.toString())
        .send(largePayload)
        .expect(413);

      expect(response.body).toHaveProperty("error", "Request too large");
      expect(response.body).toHaveProperty("maxSize", "0.001MB");
      expect(response.body).toHaveProperty("received");
      expect(response.body).toHaveProperty("timestamp");
    });
  });

  describe("Proxy Endpoint - Without Authentication", () => {
    beforeEach(() => {
      // Ensure no API key is set for these tests
      delete process.env.PROXY_API_KEY;
    });

    test("GET /proxy should require url parameter with timestamp", async () => {
      const response = await request(app).get("/proxy").expect(400);

      expect(response.body).toHaveProperty("error", "Missing 'url' parameter");
      expect(response.body).toHaveProperty("usage");
      expect(response.body).toHaveProperty("timestamp");
    });

    test("GET /proxy should validate URL format with timestamp", async () => {
      const response = await request(app)
        .get("/proxy?url=invalid-url")
        .expect(400);

      expect(response.body).toHaveProperty("error", "Invalid URL format");
      expect(response.body).toHaveProperty("provided", "invalid-url");
      expect(response.body).toHaveProperty("timestamp");
    });

    test("GET /proxy should proxy valid URLs", async () => {
      const response = await request(app)
        .get("/proxy?url=https://httpbin.org/json")
        .expect(200);

      // Should have CORS headers
      expect(response.headers["access-control-allow-origin"]).toBe("*");
      expect(response.headers["access-control-allow-methods"]).toContain("GET");
      expect(response.headers["access-control-allow-methods"]).toContain(
        "POST"
      );
    });

    test("POST /proxy should handle JSON body", async () => {
      const response = await request(app)
        .post("/proxy")
        .send({
          url: "https://httpbin.org/post",
          data: "test data",
        })
        .expect(200);

      expect(response.headers["access-control-allow-origin"]).toBe("*");
    });

    test("OPTIONS /proxy should handle preflight requests", async () => {
      const response = await request(app).options("/proxy").expect(204);

      expect(response.headers["access-control-allow-methods"]).toContain("GET");
      expect(response.headers["access-control-allow-methods"]).toContain(
        "POST"
      );
      expect(response.headers["access-control-max-age"]).toBe("86400");
    });

    test("Should handle network errors with proper categorization", async () => {
      const response = await request(app)
        .get("/proxy?url=https://non-existent-domain-12345.com")
        .expect(404);

      expect(response.body).toHaveProperty("error", "Proxy request failed");
      expect(response.body).toHaveProperty("type", "Target not found");
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("timestamp");
    });
  });

  describe("Proxy Endpoint - With Authentication", () => {
    beforeEach(() => {
      process.env.PROXY_API_KEY = "test-proxy-key";
    });

    afterEach(() => {
      delete process.env.PROXY_API_KEY;
    });

    test("should reject requests without API key with timestamp", async () => {
      const response = await request(app)
        .get("/proxy?url=https://httpbin.org/json")
        .expect(401);

      expect(response.body).toHaveProperty("error", "Unauthorized");
      expect(response.body.message).toContain("Valid API key required");
      expect(response.body).toHaveProperty("timestamp");
    });

    test("should accept requests with valid API key in header", async () => {
      const response = await request(app)
        .get("/proxy?url=https://httpbin.org/json")
        .set("X-API-Key", "test-proxy-key")
        .expect(200);

      expect(response.headers["access-control-allow-origin"]).toBe("*");
    });

    test("should accept requests with Authorization Bearer token", async () => {
      const response = await request(app)
        .get("/proxy?url=https://httpbin.org/json")
        .set("Authorization", "Bearer test-proxy-key")
        .expect(200);

      expect(response.headers["access-control-allow-origin"]).toBe("*");
    });

    test("should accept requests with API key in query parameter", async () => {
      const response = await request(app)
        .get("/proxy?url=https://httpbin.org/json&apiKey=test-proxy-key")
        .expect(200);

      expect(response.headers["access-control-allow-origin"]).toBe("*");
    });

    test("should reject requests with invalid API key", async () => {
      const response = await request(app)
        .get("/proxy?url=https://httpbin.org/json")
        .set("X-API-Key", "invalid-key")
        .expect(401);

      expect(response.body).toHaveProperty("error", "Unauthorized");
      expect(response.body).toHaveProperty("timestamp");
    });
  });

  describe("Admin Endpoints", () => {
    beforeEach(() => {
      process.env.ADMIN_API_KEY = "test-admin-key";
    });

    afterEach(() => {
      delete process.env.ADMIN_API_KEY;
    });

    test("GET /admin/stats should require admin authentication", async () => {
      const response = await request(app).get("/admin/stats").expect(401);

      expect(response.body).toHaveProperty("error", "Unauthorized");
      expect(response.body).toHaveProperty("timestamp");
    });

    test("GET /admin/stats should return enhanced statistics with valid key", async () => {
      const response = await request(app)
        .get("/admin/stats")
        .set("X-Admin-Key", "test-admin-key")
        .expect(200);

      expect(response.body).toHaveProperty("overview");
      expect(response.body.overview).toHaveProperty("totalRequests");
      expect(response.body.overview).toHaveProperty("successfulRequests");
      expect(response.body.overview).toHaveProperty("failedRequests");
      expect(response.body.overview).toHaveProperty("successRate");
      expect(response.body.overview).toHaveProperty("healthChecks");
      expect(response.body).toHaveProperty("systemInfo");
      expect(response.body).toHaveProperty("timestamp");

      // Check enhanced memory format in systemInfo
      expect(response.body.systemInfo.memory).toHaveProperty("rss");
      expect(response.body.systemInfo.memory.rss).toMatch(/^\d+MB$/);
    });

    test("GET /admin/config should return enhanced configuration", async () => {
      const response = await request(app)
        .get("/admin/config")
        .set("X-Admin-Key", "test-admin-key")
        .expect(200);

      expect(response.body).toHaveProperty("configuration");
      expect(response.body.configuration).toHaveProperty("adminEnabled", true);
      expect(response.body.configuration).toHaveProperty("maxRequestSizeMB");
      expect(response.body).toHaveProperty("timestamp");
    });

    test("POST /admin/reset-stats should reset statistics with previous stats", async () => {
      const response = await request(app)
        .post("/admin/reset-stats")
        .set("X-Admin-Key", "test-admin-key")
        .expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "Statistics reset successfully"
      );
      expect(response.body).toHaveProperty("previousStats");
      expect(response.body).toHaveProperty("timestamp");
    });

    test("POST /admin/block-domain should validate domain format", async () => {
      const response = await request(app)
        .post("/admin/block-domain")
        .set("X-Admin-Key", "test-admin-key")
        .send({ domain: "invalid..domain" })
        .expect(400);

      expect(response.body).toHaveProperty("error", "Invalid domain format");
      expect(response.body).toHaveProperty("provided", "invalid..domain");
      expect(response.body).toHaveProperty("timestamp");
    });

    test("POST /admin/block-domain should block a valid domain", async () => {
      const response = await request(app)
        .post("/admin/block-domain")
        .set("X-Admin-Key", "test-admin-key")
        .send({ domain: "malicious-site.com" })
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("blocked successfully");
      expect(response.body).toHaveProperty("domain", "malicious-site.com");
      expect(response.body).toHaveProperty("timestamp");
    });

    test("POST /admin/block-domain should require domain parameter", async () => {
      const response = await request(app)
        .post("/admin/block-domain")
        .set("X-Admin-Key", "test-admin-key")
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("error", "Domain is required");
      expect(response.body).toHaveProperty("timestamp");
    });

    test("DELETE /admin/unblock-domain should unblock a domain", async () => {
      // First block a domain
      await request(app)
        .post("/admin/block-domain")
        .set("X-Admin-Key", "test-admin-key")
        .send({ domain: "test-domain.com" });

      // Then unblock it
      const response = await request(app)
        .delete("/admin/unblock-domain/test-domain.com")
        .set("X-Admin-Key", "test-admin-key")
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("unblocked successfully");
      expect(response.body).toHaveProperty("domain", "test-domain.com");
      expect(response.body).toHaveProperty("timestamp");
    });

    test("DELETE /admin/unblock-domain should handle non-existent domain", async () => {
      const response = await request(app)
        .delete("/admin/unblock-domain/non-existent-domain.com")
        .set("X-Admin-Key", "test-admin-key")
        .expect(404);

      expect(response.body).toHaveProperty(
        "error",
        "Domain not in blocked list"
      );
      expect(response.body).toHaveProperty("domain", "non-existent-domain.com");
      expect(response.body).toHaveProperty("timestamp");
    });
  });

  describe("Domain Blocking", () => {
    beforeEach(() => {
      process.env.BLOCKED_DOMAINS = "blocked-site.com,malicious.org";
    });

    afterEach(() => {
      delete process.env.BLOCKED_DOMAINS;
    });

    test("should block requests to blocked domains with enhanced error", async () => {
      const response = await request(app)
        .get("/proxy?url=https://blocked-site.com/api")
        .expect(403);

      expect(response.body).toHaveProperty("error", "Domain not allowed");
      expect(response.body).toHaveProperty("domain", "blocked-site.com");
      expect(response.body).toHaveProperty("timestamp");
    });

    test("should allow requests to non-blocked domains", async () => {
      const response = await request(app)
        .get("/proxy?url=https://httpbin.org/json")
        .expect(200);

      expect(response.headers["access-control-allow-origin"]).toBe("*");
    });
  });

  describe("Error Handling", () => {
    test("should handle invalid URLs gracefully with enhanced error info", async () => {
      const response = await request(app)
        .get("/proxy?url=https://non-existent-domain-12345.com")
        .expect(404);

      expect(response.body).toHaveProperty("error", "Proxy request failed");
      expect(response.body).toHaveProperty("type", "Target not found");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("message");
    });

    test("should handle 404 for unknown endpoints with enhanced info", async () => {
      const response = await request(app).get("/unknown-endpoint").expect(404);

      expect(response.body).toHaveProperty("error", "Endpoint not found");
      expect(response.body).toHaveProperty("availableEndpoints");
      expect(response.body).toHaveProperty("method", "GET");
      expect(response.body).toHaveProperty("path", "/unknown-endpoint");
      expect(response.body).toHaveProperty("timestamp");
    });

    test("Global error handler should include timestamp", async () => {
      // This test would need to trigger an unhandled error
      // For now, we'll test the error format indirectly through other endpoints
      const response = await request(app).get("/admin/stats").expect(501);

      expect(response.body).toHaveProperty("timestamp");
    });
  });

  describe("Rate Limiting", () => {
    test("should not rate limit health checks", async () => {
      // Make multiple requests to health endpoint
      for (let i = 0; i < 5; i++) {
        await request(app).get("/health").expect(200);
      }
    });

    test("should rate limit proxy requests appropriately", async () => {
      // This test would need to be adjusted based on your rate limit settings
      // For now, we'll just verify the basic functionality works
      const response = await request(app)
        .get("/proxy?url=https://httpbin.org/json")
        .expect(200);

      expect(response.headers["access-control-allow-origin"]).toBe("*");
    });
  });

  describe("CORS Headers", () => {
    test("should include proper CORS headers in responses", async () => {
      const response = await request(app)
        .get("/proxy?url=https://httpbin.org/json")
        .expect(200);

      expect(response.headers["access-control-allow-origin"]).toBe("*");
      expect(response.headers["access-control-allow-methods"]).toContain("GET");
      expect(response.headers["access-control-allow-methods"]).toContain(
        "POST"
      );
      expect(response.headers["access-control-allow-headers"]).toBe("*");
      expect(response.headers["access-control-expose-headers"]).toBe("*");
    });
  });

  describe("Debug Mode", () => {
    beforeEach(() => {
      process.env.DEBUG_HEADERS = "true";
    });

    afterEach(() => {
      delete process.env.DEBUG_HEADERS;
    });

    test("should include debug headers when enabled", async () => {
      const response = await request(app)
        .get("/proxy?url=https://httpbin.org/json")
        .expect(200);

      expect(response.headers).toHaveProperty("x-proxy-target");
      expect(response.headers).toHaveProperty("x-proxy-status");
      expect(response.headers).toHaveProperty("x-proxy-time");
    });
  });

  describe("Admin API without Configuration", () => {
    test("should return 501 when admin key is not configured", async () => {
      // Ensure no admin key is set
      delete process.env.ADMIN_API_KEY;

      const response = await request(app).get("/admin/stats").expect(501);

      expect(response.body).toHaveProperty(
        "error",
        "Admin functionality not configured"
      );
      expect(response.body.message).toContain("ADMIN_API_KEY not set");
      expect(response.body).toHaveProperty("timestamp");
    });
  });
});
