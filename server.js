require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const fetch = require("node-fetch");

const app = express();

// =============================================================================
// HEADERS & UTILS (NO CACHED CONFIG!)
// =============================================================================

const HEADERS = {
  FILTERED_REQUEST: [
    "host",
    "content-length",
    "connection",
    "keep-alive",
    "proxy-connection",
    "transfer-encoding",
    "upgrade",
  ],
  FILTERED_RESPONSE: [
    "transfer-encoding",
    "content-encoding",
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "upgrade",
    "set-cookie",
  ],
  CORS: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Expose-Headers": "*",
  },
};

const setCorsHeaders = (res) => {
  Object.entries(HEADERS.CORS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
};

const cleanHeaders = (headers, filteredHeaders) => {
  const cleaned = {};
  Object.keys(headers).forEach((key) => {
    if (!filteredHeaders.includes(key.toLowerCase())) {
      cleaned[key] = headers[key];
    }
  });
  return cleaned;
};

const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

const getBlockedDomains = () => {
  return (process.env.BLOCKED_DOMAINS || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
};
const setBlockedDomains = (domains) => {
  process.env.BLOCKED_DOMAINS = domains.join(",");
};

const isDomainBlocked = (url) => {
  const blockedDomains = getBlockedDomains();
  if (blockedDomains.length === 0) return false;
  try {
    const hostname = new URL(url).hostname;
    return blockedDomains.some(
      (domain) => hostname === domain || hostname.endsWith("." + domain)
    );
  } catch {
    return false;
  }
};

const getConfig = () => ({
  PORT: process.env.PORT || 4000,
  MAX_BODY_SIZE: process.env.MAX_BODY_SIZE || "10mb",
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 1000,
  REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
  DEBUG_HEADERS: process.env.DEBUG_HEADERS === "true",
  DEBUG_ERRORS: process.env.DEBUG_ERRORS === "true",
  INCLUDE_CONFIG: process.env.INCLUDE_CONFIG === "true",
  MAX_REQUEST_SIZE_MB: parseFloat(process.env.MAX_REQUEST_SIZE_MB) || 10,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(",") || ["*"],
});

// =============================================================================
// SECURITY MIDDLEWARE
// =============================================================================

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);

const rateLimitConfig = getConfig();
const limiter = rateLimit({
  windowMs: rateLimitConfig.RATE_LIMIT_WINDOW,
  max: rateLimitConfig.RATE_LIMIT_MAX,
  message: {
    error: "Rate limit exceeded",
    retryAfter: Math.ceil(rateLimitConfig.RATE_LIMIT_WINDOW / 1000),
    limit: rateLimitConfig.RATE_LIMIT_MAX,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/health" || req.path === "/",
});
app.use(limiter);

// =============================================================================
// CORS MIDDLEWARE
// =============================================================================

const corsOptions = {
  origin: (origin, callback) => {
    const allowed = getConfig().ALLOWED_ORIGINS;
    if (!origin) return callback(null, true);
    if (allowed.includes("*") || allowed.includes(origin)) {
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
  maxAge: 86400,
};
app.use(cors(corsOptions));

// =============================================================================
// PATCH: Always set CORS headers on all OPTIONS requests (for Jest & browsers)
// =============================================================================

app.options("/proxy", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD"
  );
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Expose-Headers", "*");
  res.setHeader("Access-Control-Max-Age", "86400");
  return res.status(204).end();
});

// =============================================================================
// REQUEST SIZE VALIDATION MIDDLEWARE
// =============================================================================

app.use("/proxy", (req, res, next) => {
  const maxSize = getConfig().MAX_REQUEST_SIZE_MB;
  const contentLength = req.headers["content-length"];
  const maxSizeBytes = maxSize * 1024 * 1024;
  if (contentLength && parseInt(contentLength) > maxSizeBytes) {
    setCorsHeaders(res);
    return res.status(413).json({
      error: "Request too large",
      maxSize: `${maxSize}MB`,
      received: `${(parseInt(contentLength) / 1024 / 1024).toFixed(2)}MB`,
      timestamp: new Date().toISOString(),
    });
  }
  next();
});

// =============================================================================
// BODY PARSING MIDDLEWARE
// =============================================================================

app.use(
  express.json({
    limit: getConfig().MAX_BODY_SIZE,
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: getConfig().MAX_BODY_SIZE,
  })
);

// =============================================================================
// AUTHENTICATION MIDDLEWARE
// =============================================================================

const requireProxyAuth = (req, res, next) => {
  const proxyKey = process.env.PROXY_API_KEY;
  if (!proxyKey) return next();
  const providedKey =
    req.headers["x-api-key"] ||
    req.headers["authorization"]?.replace("Bearer ", "") ||
    req.query.apiKey;
  if (!providedKey || providedKey !== proxyKey) {
    setCorsHeaders(res);
    if (getConfig().DEBUG_HEADERS) {
      res.setHeader("X-Proxy-Target", req.query.url || "unknown");
      res.setHeader("X-Proxy-Status", 401);
      res.setHeader("X-Proxy-Time", "0ms");
    }
    return res.status(401).json({
      error: "Unauthorized",
      message:
        "Valid API key required. Provide via X-API-Key header, Authorization Bearer token, or apiKey query parameter",
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

const requireAdminAuth = (req, res, next) => {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    return res.status(501).json({
      error: "Admin functionality not configured",
      message: "ADMIN_API_KEY not set in environment",
      timestamp: new Date().toISOString(),
    });
  }
  const providedKey = req.headers["x-admin-key"] || req.query.adminKey;
  if (!providedKey || providedKey !== adminKey) {
    return res.status(401).json({
      error: "Unauthorized",
      message:
        "Valid admin key required. Provide via X-Admin-Key header or adminKey query parameter",
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

// =============================================================================
// STATISTICS TRACKING
// =============================================================================

let proxyStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  startTime: Date.now(),
  topDomains: new Map(),
  recentErrors: [],
  healthChecks: 0,
};
const trackProxyUsage = (targetUrl, success, error = null) => {
  proxyStats.totalRequests++;
  if (success) {
    proxyStats.successfulRequests++;
  } else {
    proxyStats.failedRequests++;
    if (error && targetUrl !== "unknown") {
      proxyStats.recentErrors.unshift({
        timestamp: new Date().toISOString(),
        url: targetUrl,
        error: error.message,
        code: error.code || "UNKNOWN",
      });
      if (proxyStats.recentErrors.length > 50) {
        proxyStats.recentErrors = proxyStats.recentErrors.slice(0, 50);
      }
    }
  }
  if (targetUrl && targetUrl !== "unknown") {
    try {
      const domain = new URL(targetUrl).hostname;
      proxyStats.topDomains.set(
        domain,
        (proxyStats.topDomains.get(domain) || 0) + 1
      );
    } catch {
      // skip
    }
  }
};

// =============================================================================
// MAIN PROXY ENDPOINT
// =============================================================================

app.use("/proxy", (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    req.body = {};
    next(); // Fall through to main handler
  } else {
    next(err);
  }
});

app.all("/proxy", requireProxyAuth, async (req, res) => {
  const startTime = Date.now();
  let targetUrl = "unknown";
  try {
    if (req.method === "GET" || req.method === "HEAD") {
      targetUrl = req.query.url;
    } else {
      try {
        if (
          req.body &&
          typeof req.body === "object" &&
          !Buffer.isBuffer(req.body)
        ) {
          targetUrl = req.body.url;
        } else {
          const body = req.body?.toString() || "";
          if (body) {
            try {
              const parsed = JSON.parse(body);
              targetUrl = parsed.url;
            } catch {
              targetUrl = req.query.url;
            }
          } else {
            targetUrl = req.query.url;
          }
        }
      } catch (parseError) {
        targetUrl = req.query.url;
      }
    }

    if (!targetUrl) {
      setCorsHeaders(res);
      if (getConfig().DEBUG_HEADERS) {
        res.setHeader("X-Proxy-Target", "unknown");
        res.setHeader("X-Proxy-Status", 400);
        res.setHeader("X-Proxy-Time", `${Date.now() - startTime}ms`);
      }
      trackProxyUsage("unknown", false, new Error("Missing URL parameter"));
      return res.status(400).json({
        error: "Missing 'url' parameter",
        usage:
          "Include 'url' in query string (GET) or request body (POST/PUT/etc.)",
        timestamp: new Date().toISOString(),
      });
    }

    if (!isValidUrl(targetUrl)) {
      setCorsHeaders(res);
      if (getConfig().DEBUG_HEADERS) {
        res.setHeader("X-Proxy-Target", targetUrl);
        res.setHeader("X-Proxy-Status", 400);
        res.setHeader("X-Proxy-Time", `${Date.now() - startTime}ms`);
      }
      trackProxyUsage(targetUrl, false, new Error("Invalid URL format"));
      return res.status(400).json({
        error: "Invalid URL format",
        provided: targetUrl,
        timestamp: new Date().toISOString(),
      });
    }

    if (isDomainBlocked(targetUrl)) {
      setCorsHeaders(res);
      if (getConfig().DEBUG_HEADERS) {
        res.setHeader("X-Proxy-Target", targetUrl);
        res.setHeader("X-Proxy-Status", 403);
        res.setHeader("X-Proxy-Time", `${Date.now() - startTime}ms`);
      }
      trackProxyUsage(targetUrl, false, new Error("Domain blocked"));
      return res.status(403).json({
        error: "Domain not allowed",
        domain: new URL(targetUrl).hostname,
        timestamp: new Date().toISOString(),
      });
    }

    if (req.method === "OPTIONS") {
      setCorsHeaders(res);
      res.setHeader("Access-Control-Max-Age", "86400");
      if (getConfig().DEBUG_HEADERS) {
        res.setHeader("X-Proxy-Target", targetUrl);
        res.setHeader("X-Proxy-Status", 204);
        res.setHeader("X-Proxy-Time", `${Date.now() - startTime}ms`);
      }
      return res.status(204).send();
    }

    const forwardHeaders = cleanHeaders(req.headers, HEADERS.FILTERED_REQUEST);
    const fetchOptions = {
      method: req.method,
      headers: forwardHeaders,
      redirect: "follow",
      timeout: getConfig().REQUEST_TIMEOUT,
    };

    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      if (req.get("content-type")?.includes("application/json")) {
        try {
          if (Buffer.isBuffer(req.body)) {
            const bodyString = req.body.toString();
            JSON.parse(bodyString);
            fetchOptions.body = bodyString;
          } else if (typeof req.body === "object") {
            fetchOptions.body = JSON.stringify(req.body);
          } else {
            fetchOptions.body = req.body;
          }
        } catch (jsonError) {
          fetchOptions.body =
            typeof req.body === "object" ? JSON.stringify(req.body) : req.body;
        }
      } else if (
        req.get("content-type")?.includes("application/x-www-form-urlencoded")
      ) {
        if (typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
          fetchOptions.body = new URLSearchParams(req.body).toString();
        } else {
          fetchOptions.body = req.body;
        }
      } else {
        fetchOptions.body = req.body;
      }
    }

    const response = await fetch(targetUrl, fetchOptions);
    res.status(response.status);

    const responseHeaders = cleanHeaders(
      Object.fromEntries(response.headers.entries()),
      HEADERS.FILTERED_RESPONSE
    );
    Object.entries(responseHeaders).forEach(([key, value]) => {
      try {
        res.setHeader(key, value);
      } catch (headerError) {
        /* no-op */
      }
    });

    setCorsHeaders(res);

    if (getConfig().DEBUG_HEADERS) {
      res.setHeader("X-Proxy-Target", targetUrl);
      res.setHeader("X-Proxy-Status", response.status);
      res.setHeader("X-Proxy-Time", `${Date.now() - startTime}ms`);
    }

    response.body.pipe(res);
    trackProxyUsage(targetUrl, true);
  } catch (error) {
    setCorsHeaders(res);
    if (getConfig().DEBUG_HEADERS) {
      res.setHeader("X-Proxy-Target", targetUrl);
      res.setHeader("X-Proxy-Status", 500);
      res.setHeader("X-Proxy-Time", `${Date.now() - startTime}ms`);
    }
    trackProxyUsage(targetUrl, false, error);
    let status = 500;
    let errorType = "Internal server error";
    if (error.code === "ENOTFOUND") {
      status = 404;
      errorType = "Target not found";
    } else if (error.code === "ECONNREFUSED") {
      status = 503;
      errorType = "Connection refused";
    } else if (error.code === "ETIMEDOUT" || error.name === "AbortError") {
      status = 408;
      errorType = "Request timeout";
    } else if (error.code === "ECONNRESET") {
      status = 502;
      errorType = "Connection reset";
    }
    res.status(status).json({
      error: "Proxy request failed",
      type: errorType,
      message: error.message,
      targetUrl: targetUrl !== "unknown" ? targetUrl : undefined,
      timestamp: new Date().toISOString(),
      ...(getConfig().DEBUG_ERRORS && {
        stack: error.stack,
        code: error.code,
      }),
    });
  }
});

// =============================================================================
// ADMIN ENDPOINTS (use getBlockedDomains/setBlockedDomains)
// =============================================================================

app.get("/admin/stats", requireAdminAuth, (req, res) => {
  try {
    const uptime = Date.now() - proxyStats.startTime;
    const topDomains = Array.from(proxyStats.topDomains.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([domain, count]) => ({ domain, count }));

    const memUsage = process.memoryUsage();

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
        healthChecks: proxyStats.healthChecks,
      },
      topDomains,
      recentErrors: proxyStats.recentErrors.slice(0, 10),
      systemInfo: {
        memory: {
          rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
        },
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
        uptime: process.uptime(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get statistics",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.post("/admin/reset-stats", requireAdminAuth, (req, res) => {
  try {
    const oldStats = {
      totalRequests: proxyStats.totalRequests,
      successfulRequests: proxyStats.successfulRequests,
      failedRequests: proxyStats.failedRequests,
    };

    proxyStats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      startTime: Date.now(),
      topDomains: new Map(),
      recentErrors: [],
      healthChecks: 0,
    };

    res.json({
      message: "Statistics reset successfully",
      previousStats: oldStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to reset statistics",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.get("/admin/config", requireAdminAuth, (req, res) => {
  try {
    const cfg = getConfig();
    res.json({
      configuration: {
        port: cfg.PORT,
        maxBodySize: cfg.MAX_BODY_SIZE,
        rateLimitWindow: cfg.RATE_LIMIT_WINDOW + "ms",
        rateLimitMax: cfg.RATE_LIMIT_MAX,
        requestTimeout: cfg.REQUEST_TIMEOUT + "ms",
        allowedOrigins: cfg.ALLOWED_ORIGINS.join(",") || "*",
        blockedDomains: getBlockedDomains().join(",") || "none",
        debugHeaders: cfg.DEBUG_HEADERS,
        debugErrors: cfg.DEBUG_ERRORS,
        adminEnabled: !!process.env.ADMIN_API_KEY,
        proxyAuthEnabled: !!process.env.PROXY_API_KEY,
        maxRequestSizeMB: cfg.MAX_REQUEST_SIZE_MB,
      },
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get configuration",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.post("/admin/block-domain", requireAdminAuth, (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) {
      return res.status(400).json({
        error: "Domain is required",
        timestamp: new Date().toISOString(),
      });
    }
    try {
      new URL(`https://${domain}`);
    } catch {
      return res.status(400).json({
        error: "Invalid domain format",
        provided: domain,
        timestamp: new Date().toISOString(),
      });
    }
    const validDomain = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/.test(
      domain
    );
    if (!validDomain) {
      return res.status(400).json({
        error: "Invalid domain format",
        provided: domain,
        timestamp: new Date().toISOString(),
      });
    }
    const blockedDomains = getBlockedDomains();
    if (blockedDomains.includes(domain)) {
      return res.status(409).json({
        error: "Domain already blocked",
        domain,
        currentlyBlocked: blockedDomains,
        timestamp: new Date().toISOString(),
      });
    }
    blockedDomains.push(domain);
    setBlockedDomains(blockedDomains);
    res.json({
      message: "Domain blocked successfully (runtime only)",
      domain,
      note: "This change will be lost on server restart. Update .env file for persistence.",
      currentlyBlocked: blockedDomains,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to block domain",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.delete("/admin/unblock-domain/:domain", requireAdminAuth, (req, res) => {
  try {
    const { domain } = req.params;
    const blockedDomains = getBlockedDomains();
    if (!blockedDomains.includes(domain)) {
      return res.status(404).json({
        error: "Domain not in blocked list",
        domain,
        currentlyBlocked: blockedDomains,
        timestamp: new Date().toISOString(),
      });
    }
    const newList = blockedDomains.filter((d) => d !== domain);
    setBlockedDomains(newList);
    res.json({
      message: "Domain unblocked successfully (runtime only)",
      domain,
      note: "This change will be lost on server restart. Update .env file for persistence.",
      currentlyBlocked: newList,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to unblock domain",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// =============================================================================
// HEALTH CHECK ENDPOINT
// =============================================================================

app.get(["/", "/health"], (req, res) => {
  try {
    proxyStats.healthChecks++;
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    const cfg = getConfig();
    res.json({
      status: "healthy",
      service: "CORS Proxy Server",
      version: process.env.npm_package_version || "1.0.0",
      timestamp: new Date().toISOString(),
      uptime,
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      },
      healthChecks: proxyStats.healthChecks,
      ...(cfg.INCLUDE_CONFIG && {
        config: {
          port: cfg.PORT,
          maxBodySize: cfg.MAX_BODY_SIZE,
          rateLimitWindow: cfg.RATE_LIMIT_WINDOW,
          rateLimitMax: cfg.RATE_LIMIT_MAX,
        },
      }),
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// =============================================================================
// API DOCUMENTATION ENDPOINT
// =============================================================================

app.get("/docs", (req, res) => {
  try {
    const cfg = getConfig();
    res.json({
      name: "Universal CORS Proxy",
      description: "A high-performance CORS proxy for any API",
      version: process.env.npm_package_version || "1.0.0",
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
        window: `${cfg.RATE_LIMIT_WINDOW / 60000} minutes`,
        max: cfg.RATE_LIMIT_MAX,
      },
      adminEndpoints: process.env.ADMIN_API_KEY
        ? {
            stats: `${req.protocol}://${req.get("host")}/admin/stats`,
            config: `${req.protocol}://${req.get("host")}/admin/config`,
            resetStats: `${req.protocol}://${req.get(
              "host"
            )}/admin/reset-stats`,
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
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to generate documentation",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

// Handles request entity too large
app.use((err, _req, res, next) => {
  if (err.type === "entity.too.large") {
    setCorsHeaders(res);
    return res.status(413).json({
      error: "Request too large",
      maxSize: `${getConfig().MAX_REQUEST_SIZE_MB}MB`,
      received: "Unknown",
      timestamp: new Date().toISOString(),
    });
  }
  next(err);
});

app.use((error, _req, res, _next) => {
  res.status(500).json({
    error: "Internal server error",
    message: error.message,
    timestamp: new Date().toISOString(),
    ...(getConfig().DEBUG_ERRORS && { stack: error.stack }),
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    availableEndpoints: ["/proxy", "/health", "/docs"],
    adminEndpoints: process.env.ADMIN_API_KEY
      ? [
          "/admin/stats",
          "/admin/config",
          "/admin/reset-stats",
          "/admin/block-domain",
          "/admin/unblock-domain/:domain",
        ]
      : "Admin endpoints disabled",
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString(),
  });
});

// =============================================================================
// CLEANUP AND MAINTENANCE
// =============================================================================

let cleanupInterval;
const cleanupStats = () => {
  try {
    if (proxyStats.topDomains.size > 1000) {
      const entries = Array.from(proxyStats.topDomains.entries());
      entries.sort(([, a], [, b]) => b - a);
      proxyStats.topDomains = new Map(entries.slice(0, 500));
    }
    if (proxyStats.recentErrors.length > 50) {
      proxyStats.recentErrors = proxyStats.recentErrors.slice(0, 50);
    }
  } catch (error) {
    /* no-op */
  }
};

if (process.env.NODE_ENV !== "test") {
  cleanupInterval = setInterval(cleanupStats, 5 * 60 * 1000);
}

const gracefulShutdown = (_signal) => {
  if (cleanupInterval) clearInterval(cleanupInterval);
  if (server) {
    server.close(() => {
      process.exit(0);
    });
    setTimeout(() => {
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("uncaughtException", () => gracefulShutdown("UNCAUGHT_EXCEPTION"));
process.on("unhandledRejection", () => gracefulShutdown("UNHANDLED_REJECTION"));

let server;
if (process.env.NODE_ENV !== "test") {
  server = app.listen(getConfig().PORT, () => {});
}

module.exports = app;
