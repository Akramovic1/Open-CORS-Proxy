require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

const app = express();
const PORT = process.env.PORT || 4000;
const MAX_BODY_SIZE = process.env.MAX_BODY_SIZE || "10mb";
const RATE_LIMIT_WINDOW =
  parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000;
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX) || 1000;

// Security headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);

// Enhanced rate limiting with detailed configuration
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW,
  max: RATE_LIMIT_MAX,
  message: {
    error: "Rate limit exceeded",
    retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000),
    limit: RATE_LIMIT_MAX,
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health check
  skip: (req) => req.path === "/health" || req.path === "/",
});

app.use(limiter);

// CORS configuration with more flexibility
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list (if ALLOWED_ORIGINS env var is set)
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["*"];
    if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "X-API-Key",
    "X-Auth-Token",
    "X-Custom-Header",
    "User-Agent",
    "Cache-Control",
    "Pragma",
  ],
  exposedHeaders: ["*"],
  credentials: false,
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Body parsing with configurable limits
app.use(
  express.json({
    limit: MAX_BODY_SIZE,
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: MAX_BODY_SIZE,
  })
);

// Raw body parser for binary data
app.use(
  "/proxy",
  express.raw({
    type: "*/*",
    limit: MAX_BODY_SIZE,
  })
);

// Headers that should be filtered out from requests
const FILTERED_REQUEST_HEADERS = [
  "host",
  "content-length",
  "connection",
  "keep-alive",
  "proxy-connection",
  "transfer-encoding",
  "upgrade",
];

// Headers that should be filtered out from responses
const FILTERED_RESPONSE_HEADERS = [
  "transfer-encoding",
  "content-encoding",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "upgrade",
  "set-cookie", // Optional: remove if you need cookies
];

// Utility function to validate URL
const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

// Utility function to clean headers
const cleanHeaders = (headers, filteredHeaders) => {
  const cleaned = {};
  Object.keys(headers).forEach((key) => {
    if (!filteredHeaders.includes(key.toLowerCase())) {
      cleaned[key] = headers[key];
    }
  });
  return cleaned;
};

// Proxy API key authentication middleware (optional)
const requireProxyAuth = (req, res, next) => {
  const proxyApiKey = process.env.PROXY_API_KEY;

  // If no API key is set, skip authentication
  if (!proxyApiKey) {
    return next();
  }

  const providedKey =
    req.headers["x-api-key"] ||
    req.headers["authorization"]?.replace("Bearer ", "") ||
    req.query.apiKey;

  if (!providedKey || providedKey !== proxyApiKey) {
    return res.status(401).json({
      error: "Unauthorized",
      message:
        "Valid API key required. Provide via X-API-Key header, Authorization Bearer token, or apiKey query parameter",
    });
  }

  next();
};

// Admin authentication middleware
const requireAdminAuth = (req, res, next) => {
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey) {
    return res.status(501).json({
      error: "Admin functionality not configured",
      message: "ADMIN_API_KEY not set in environment",
    });
  }

  const providedKey = req.headers["x-admin-key"] || req.query.adminKey;

  if (!providedKey || providedKey !== adminKey) {
    return res.status(401).json({
      error: "Unauthorized",
      message:
        "Valid admin key required. Provide via X-Admin-Key header or adminKey query parameter",
    });
  }

  next();
};

// Stats tracking for admin endpoints
let proxyStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  startTime: Date.now(),
  topDomains: new Map(),
  recentErrors: [],
};

// Utility to track proxy usage
const trackProxyUsage = (targetUrl, success, error = null) => {
  proxyStats.totalRequests++;

  if (success) {
    proxyStats.successfulRequests++;
  } else {
    proxyStats.failedRequests++;
    if (error) {
      proxyStats.recentErrors.unshift({
        timestamp: new Date().toISOString(),
        url: targetUrl,
        error: error.message,
      });
      // Keep only last 50 errors
      if (proxyStats.recentErrors.length > 50) {
        proxyStats.recentErrors = proxyStats.recentErrors.slice(0, 50);
      }
    }
  }

  // Track domain usage
  if (targetUrl) {
    try {
      const domain = new URL(targetUrl).hostname;
      proxyStats.topDomains.set(
        domain,
        (proxyStats.topDomains.get(domain) || 0) + 1
      );
    } catch {
      // Invalid URL, skip domain tracking
    }
  }
};

// Main proxy endpoint
app.all("/proxy", requireProxyAuth, async (req, res) => {
  const startTime = Date.now();

  try {
    // Get target URL from query or body
    let targetUrl;
    if (req.method === "GET" || req.method === "HEAD") {
      targetUrl = req.query.url;
    } else {
      // Try to parse JSON body first, then fall back to form data
      try {
        const body = req.body.toString();
        const parsed = JSON.parse(body);
        targetUrl = parsed.url;
      } catch {
        targetUrl = req.body.url || req.query.url;
      }
    }

    // Validation
    if (!targetUrl) {
      return res.status(400).json({
        error: "Missing 'url' parameter",
        usage:
          "Include 'url' in query string (GET) or request body (POST/PUT/etc.)",
      });
    }

    if (!isValidUrl(targetUrl)) {
      return res.status(400).json({
        error: "Invalid URL format",
        provided: targetUrl,
      });
    }

    // Optional: Block certain domains (if BLOCKED_DOMAINS env var is set)
    const blockedDomains = process.env.BLOCKED_DOMAINS?.split(",") || [];
    const urlDomain = new URL(targetUrl).hostname;
    if (blockedDomains.some((domain) => urlDomain.includes(domain))) {
      return res.status(403).json({ error: "Domain not allowed" });
    }

    // Prepare headers
    const forwardHeaders = cleanHeaders(req.headers, FILTERED_REQUEST_HEADERS);

    // Dynamic import for node-fetch
    const fetch = (await import("node-fetch")).default;

    // Prepare request options
    const fetchOptions = {
      method: req.method,
      headers: forwardHeaders,
      redirect: "follow",
      timeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
    };

    // Handle request body for non-GET/HEAD/OPTIONS requests
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      if (req.get("content-type")?.includes("application/json")) {
        try {
          const body = req.body.toString();
          JSON.parse(body); // Validate JSON
          fetchOptions.body = body;
        } catch {
          fetchOptions.body = JSON.stringify(req.body);
        }
      } else if (
        req.get("content-type")?.includes("application/x-www-form-urlencoded")
      ) {
        fetchOptions.body = new URLSearchParams(req.body).toString();
      } else {
        fetchOptions.body = req.body;
      }
    }

    // Handle preflight OPTIONS requests
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD"
      );
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Max-Age", "86400");
      return res.status(204).send();
    }

    // Make the proxied request
    const response = await fetch(targetUrl, fetchOptions);

    // Set response status
    res.status(response.status);

    // Forward response headers (filtered)
    const responseHeaders = cleanHeaders(
      Object.fromEntries(response.headers.entries()),
      FILTERED_RESPONSE_HEADERS
    );

    Object.entries(responseHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Always set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD"
    );
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Expose-Headers", "*");

    // Add custom headers for debugging (optional)
    if (process.env.DEBUG_HEADERS === "true") {
      res.setHeader("X-Proxy-Target", targetUrl);
      res.setHeader("X-Proxy-Status", response.status);
      res.setHeader("X-Proxy-Time", `${Date.now() - startTime}ms`);
    }

    // Stream the response body
    response.body.pipe(res);

    // Track successful request
    trackProxyUsage(targetUrl, true);
  } catch (error) {
    console.error("Proxy error:", error.message);

    // Track failed request
    trackProxyUsage(targetUrl, false, error);

    // Determine appropriate error status
    let status = 500;
    if (error.code === "ENOTFOUND") status = 404;
    if (error.code === "ECONNREFUSED") status = 503;
    if (error.name === "AbortError") status = 408;

    res.status(status).json({
      error: "Proxy request failed",
      message: error.message,
      timestamp: new Date().toISOString(),
      ...(process.env.DEBUG_ERRORS === "true" && { stack: error.stack }),
    });
  }
});

// Admin endpoints
app.get("/admin/stats", requireAdminAuth, (req, res) => {
  const uptime = Date.now() - proxyStats.startTime;
  const topDomains = Array.from(proxyStats.topDomains.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([domain, count]) => ({ domain, count }));

  res.json({
    overview: {
      totalRequests: proxyStats.totalRequests,
      successfulRequests: proxyStats.successfulRequests,
      failedRequests: proxyStats.failedRequests,
      successRate:
        proxyStats.totalRequests > 0
          ? (
              (proxyStats.successfulRequests / proxyStats.totalRequests) *
              100
            ).toFixed(2) + "%"
          : "0%",
      uptime: Math.floor(uptime / 1000) + " seconds",
    },
    topDomains,
    recentErrors: proxyStats.recentErrors.slice(0, 10),
    systemInfo: {
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid,
    },
  });
});

app.post("/admin/reset-stats", requireAdminAuth, (req, res) => {
  proxyStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    startTime: Date.now(),
    topDomains: new Map(),
    recentErrors: [],
  };

  res.json({
    message: "Statistics reset successfully",
    timestamp: new Date().toISOString(),
  });
});

app.get("/admin/config", requireAdminAuth, (req, res) => {
  res.json({
    configuration: {
      port: PORT,
      maxBodySize: MAX_BODY_SIZE,
      rateLimitWindow: RATE_LIMIT_WINDOW + "ms",
      rateLimitMax: RATE_LIMIT_MAX,
      requestTimeout: (parseInt(process.env.REQUEST_TIMEOUT) || 30000) + "ms",
      allowedOrigins: process.env.ALLOWED_ORIGINS || "*",
      blockedDomains: process.env.BLOCKED_DOMAINS || "none",
      debugHeaders: process.env.DEBUG_HEADERS === "true",
      debugErrors: process.env.DEBUG_ERRORS === "true",
      adminEnabled: !!process.env.ADMIN_API_KEY,
      proxyAuthEnabled: !!process.env.PROXY_API_KEY,
    },
    environment: process.env.NODE_ENV || "development",
  });
});

app.post("/admin/block-domain", requireAdminAuth, (req, res) => {
  const { domain } = req.body;

  if (!domain) {
    return res.status(400).json({ error: "Domain is required" });
  }

  const currentBlocked = process.env.BLOCKED_DOMAINS
    ? process.env.BLOCKED_DOMAINS.split(",")
    : [];

  if (currentBlocked.includes(domain)) {
    return res.status(409).json({
      error: "Domain already blocked",
      domain,
      currentlyBlocked: currentBlocked,
    });
  }

  // Note: This only affects runtime, not the actual .env file
  // In production, you'd want to persist this to a database or config file
  const newBlocked = [...currentBlocked, domain].join(",");
  process.env.BLOCKED_DOMAINS = newBlocked;

  res.json({
    message: "Domain blocked successfully (runtime only)",
    domain,
    note: "This change will be lost on server restart. Update .env file for persistence.",
    currentlyBlocked: newBlocked.split(","),
  });
});

app.delete("/admin/unblock-domain/:domain", requireAdminAuth, (req, res) => {
  const { domain } = req.params;

  const currentBlocked = process.env.BLOCKED_DOMAINS
    ? process.env.BLOCKED_DOMAINS.split(",")
    : [];

  if (!currentBlocked.includes(domain)) {
    return res.status(404).json({
      error: "Domain not in blocked list",
      domain,
      currentlyBlocked: currentBlocked,
    });
  }

  const newBlocked = currentBlocked.filter((d) => d !== domain).join(",");
  process.env.BLOCKED_DOMAINS = newBlocked;

  res.json({
    message: "Domain unblocked successfully (runtime only)",
    domain,
    note: "This change will be lost on server restart. Update .env file for persistence.",
    currentlyBlocked: newBlocked ? newBlocked.split(",") : [],
  });
});

// Health check endpoint
app.get(["/", "/health"], (req, res) => {
  res.json({
    status: "healthy",
    service: "CORS Proxy Server",
    version: process.env.npm_package_version || "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    ...(process.env.INCLUDE_CONFIG === "true" && {
      config: {
        port: PORT,
        maxBodySize: MAX_BODY_SIZE,
        rateLimitWindow: RATE_LIMIT_WINDOW,
        rateLimitMax: RATE_LIMIT_MAX,
      },
    }),
  });
});

// API documentation endpoint
app.get("/docs", (req, res) => {
  res.json({
    name: "Universal CORS Proxy",
    description: "A high-performance CORS proxy for any API",
    usage: {
      endpoint: "/proxy",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
      parameters: {
        url: "Target URL to proxy (required)",
      },
      authentication: process.env.PROXY_API_KEY
        ? {
            required: true,
            methods: [
              "X-API-Key header",
              "Authorization: Bearer <token>",
              "apiKey query parameter",
            ],
            note: "API key authentication is enabled",
          }
        : {
            required: false,
            note: "No authentication required (set PROXY_API_KEY to enable)",
          },
      examples: {
        get: process.env.PROXY_API_KEY
          ? `${req.protocol}://${req.get(
              "host"
            )}/proxy?url=https://api.example.com/data&apiKey=YOUR_API_KEY`
          : `${req.protocol}://${req.get(
              "host"
            )}/proxy?url=https://api.example.com/data`,
        post: {
          url: `${req.protocol}://${req.get("host")}/proxy`,
          headers: process.env.PROXY_API_KEY
            ? { "X-API-Key": "YOUR_API_KEY" }
            : {},
          body: { url: "https://api.example.com/data", data: "your data" },
        },
      },
    },
    rateLimit: {
      window: `${RATE_LIMIT_WINDOW / 60000} minutes`,
      max: RATE_LIMIT_MAX,
    },
    adminEndpoints: process.env.ADMIN_API_KEY
      ? {
          stats: `${req.protocol}://${req.get("host")}/admin/stats`,
          config: `${req.protocol}://${req.get("host")}/admin/config`,
          resetStats: `${req.protocol}://${req.get("host")}/admin/reset-stats`,
          blockDomain: `${req.protocol}://${req.get(
            "host"
          )}/admin/block-domain`,
          unblockDomain: `${req.protocol}://${req.get(
            "host"
          )}/admin/unblock-domain/:domain`,
          authentication:
            "Include X-Admin-Key header or adminKey query parameter",
        }
      : "Admin endpoints disabled (set ADMIN_API_KEY to enable)",
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    error: "Internal server error",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    availableEndpoints: ["/proxy", "/health", "/docs"],
    method: req.method,
    path: req.path,
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Universal CORS Proxy running on port ${PORT}`);
  console.log(`📖 Documentation available at http://localhost:${PORT}/docs`);
  console.log(`❤️  Health check at http://localhost:${PORT}/health`);
});

// Handle server errors
server.on("error", (error) => {
  console.error("Server error:", error);
  process.exit(1);
});

module.exports = app;
