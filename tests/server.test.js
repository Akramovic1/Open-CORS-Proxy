const request = require("supertest");

// Import the app
let app;

describe("Universal CORS Proxy Server", () => {
  beforeAll(() => {
    // Import app after setting test environment
    process.env.NODE_ENV = "test";
    app = require("../server");
  });

  afterAll(async () => {
    // Clean up environment variables
    delete process.env.PROXY_API_KEY;
    delete process.env.ADMIN_API_KEY;
    delete process.env.BLOCKED_DOMAINS;
  });

  describe("Health Check", () => {
    test("GET /health should return server status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toHaveProperty("status", "healthy");
      expect(response.body).toHaveProperty("service", "CORS Proxy Server");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
      expect(response.body).toHaveProperty("memory");
    });

    test("GET / should return server status", async () => {
      const response = await request(app).get("/").expect(200);

      expect(response.body).toHaveProperty("status", "healthy");
    });
  });

  describe("API Documentation", () => {
    test("GET /docs should return API documentation", async () => {
      const response = await request(app).get("/docs").expect(200);

      expect(response.body).toHaveProperty("name", "Universal CORS Proxy");
      expect(response.body).toHaveProperty("usage");
      expect(response.body.usage).toHaveProperty("endpoint", "/proxy");
      expect(response.body).toHaveProperty("rateLimit");
    });
  });

  describe("Proxy Endpoint - Without Authentication", () => {
    beforeEach(() => {
      // Ensure no API key is set for these tests
      delete process.env.PROXY_API_KEY;
    });

    test("GET /proxy should require url parameter", async () => {
      const response = await request(app).get("/proxy").expect(400);

      expect(response.body).toHaveProperty("error", "Missing 'url' parameter");
      expect(response.body).toHaveProperty("usage");
    });

    test("GET /proxy should validate URL format", async () => {
      const response = await request(app)
        .get("/proxy?url=invalid-url")
        .expect(400);

      expect(response.body).toHaveProperty("error", "Invalid URL format");
      expect(response.body).toHaveProperty("provided", "invalid-url");
    });

    test("GET /proxy should proxy valid URLs", async () => {
      const response = await request(app)
        .get("/proxy?url=https://httpbin.org/json")
        .expect(200);

      // Should have CORS headers
      expect(response.headers["access-control-allow-origin"]).toBe("*");
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

      expect(response.headers["access-control-allow-origin"]).toBe("*");
      expect(response.headers["access-control-allow-methods"]).toContain("GET");
      expect(response.headers["access-control-allow-methods"]).toContain(
        "POST"
      );
    });
  });

  describe("Proxy Endpoint - With Authentication", () => {
    beforeEach(() => {
      process.env.PROXY_API_KEY = "test-proxy-key";
    });

    afterEach(() => {
      delete process.env.PROXY_API_KEY;
    });

    test("should reject requests without API key", async () => {
      const response = await request(app)
        .get("/proxy?url=https://httpbin.org/json")
        .expect(401);

      expect(response.body).toHaveProperty("error", "Unauthorized");
      expect(response.body.message).toContain("Valid API key required");
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
    });

    test("GET /admin/stats should return statistics with valid key", async () => {
      const response = await request(app)
        .get("/admin/stats")
        .set("X-Admin-Key", "test-admin-key")
        .expect(200);

      expect(response.body).toHaveProperty("overview");
      expect(response.body.overview).toHaveProperty("totalRequests");
      expect(response.body.overview).toHaveProperty("successfulRequests");
      expect(response.body.overview).toHaveProperty("failedRequests");
      expect(response.body).toHaveProperty("systemInfo");
    });

    test("GET /admin/config should return configuration", async () => {
      const response = await request(app)
        .get("/admin/config")
        .set("X-Admin-Key", "test-admin-key")
        .expect(200);

      expect(response.body).toHaveProperty("configuration");
      expect(response.body.configuration).toHaveProperty("adminEnabled", true);
    });

    test("POST /admin/reset-stats should reset statistics", async () => {
      const response = await request(app)
        .post("/admin/reset-stats")
        .set("X-Admin-Key", "test-admin-key")
        .expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "Statistics reset successfully"
      );
      expect(response.body).toHaveProperty("timestamp");
    });

    test("POST /admin/block-domain should block a domain", async () => {
      const response = await request(app)
        .post("/admin/block-domain")
        .set("X-Admin-Key", "test-admin-key")
        .send({ domain: "malicious-site.com" })
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("blocked successfully");
      expect(response.body).toHaveProperty("domain", "malicious-site.com");
    });

    test("POST /admin/block-domain should require domain parameter", async () => {
      const response = await request(app)
        .post("/admin/block-domain")
        .set("X-Admin-Key", "test-admin-key")
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("error", "Domain is required");
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
    });
  });

  describe("Domain Blocking", () => {
    beforeEach(() => {
      process.env.BLOCKED_DOMAINS = "blocked-site.com,malicious.org";
    });

    afterEach(() => {
      delete process.env.BLOCKED_DOMAINS;
    });

    test("should block requests to blocked domains", async () => {
      const response = await request(app)
        .get("/proxy?url=https://blocked-site.com/api")
        .expect(403);

      expect(response.body).toHaveProperty("error", "Domain not allowed");
    });

    test("should allow requests to non-blocked domains", async () => {
      const response = await request(app)
        .get("/proxy?url=https://httpbin.org/json")
        .expect(200);

      expect(response.headers["access-control-allow-origin"]).toBe("*");
    });
  });

  describe("Error Handling", () => {
    test("should handle invalid URLs gracefully", async () => {
      const response = await request(app)
        .get("/proxy?url=https://non-existent-domain-12345.com")
        .expect(404);

      expect(response.body).toHaveProperty("error", "Proxy request failed");
      expect(response.body).toHaveProperty("timestamp");
    });

    test("should handle 404 for unknown endpoints", async () => {
      const response = await request(app).get("/unknown-endpoint").expect(404);

      expect(response.body).toHaveProperty("error", "Endpoint not found");
      expect(response.body).toHaveProperty("availableEndpoints");
    });
  });

  describe("Rate Limiting", () => {
    test("should not rate limit health checks", async () => {
      // Make multiple requests to health endpoint
      for (let i = 0; i < 5; i++) {
        await request(app).get("/health").expect(200);
      }
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
    });
  });
});
