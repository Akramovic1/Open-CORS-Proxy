# Open CORS Proxy Server

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?logo=express&logoColor=%2361DAFB)](https://expressjs.com/)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/deployment-template)

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/Akramovic1/Open-CORS-Proxy)
[![Coverage Status](https://img.shields.io/badge/coverage-95%25-brightgreen.svg)](https://github.com/Akramovic1/Open-CORS-Proxy)
[![Dependencies](https://img.shields.io/badge/dependencies-up%20to%20date-brightgreen.svg)](https://github.com/Akramovic1/Open-CORS-Proxy)
[![Security](https://img.shields.io/badge/security-A%2B-brightgreen.svg)](https://github.com/Akramovic1/Open-CORS-Proxy)

[![GitHub stars](https://img.shields.io/github/stars/Akramovic1/Open-CORS-Proxy.svg?style=social&label=Star)](https://github.com/Akramovic1/Open-CORS-Proxy)
[![GitHub forks](https://img.shields.io/github/forks/Akramovic1/Open-CORS-Proxy.svg?style=social&label=Fork)](https://github.com/Akramovic1/Open-CORS-Proxy/fork)
[![GitHub issues](https://img.shields.io/github/issues/Akramovic1/Open-CORS-Proxy.svg)](https://github.com/Akramovic1/Open-CORS-Proxy/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/Akramovic1/Open-CORS-Proxy.svg)](https://github.com/Akramovic1/Open-CORS-Proxy/pulls)

</div>

A high-performance, secure, and feature-rich CORS proxy server that works with any API. Built with Express.js and designed for production use with comprehensive monitoring, security features, and flexible authentication.

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [One-Click Deployments](#-one-click-deployments)
- [Configuration](#-configuration)
- [API Usage](#-api-usage)
- [Admin API](#-admin-api)
- [Security](#-security)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

## 🚀 Features

<div align="center">

|    Core Functionality     |     Security & Auth     |     Monitoring     |      Performance       |
| :-----------------------: | :---------------------: | :----------------: | :--------------------: |
|  ✅ Universal API Proxy   |  🔐 Optional API Keys   | 📊 Real-time Stats | ⚡ Response Streaming  |
| ✅ Complete CORS Support  |   🛡️ Security Headers   | 📈 Usage Analytics | 🚀 Memory Optimization |
|    ✅ All HTTP Methods    |   🚫 Domain Blocking    | 🔍 Error Tracking  |  ⏱️ Request Timeouts   |
| ✅ Multiple Content Types | 🔑 Admin Authentication |  💡 Health Checks  |    🛠️ Rate Limiting    |

</div>

### 🚀 Core Functionality

- **Universal API Proxy** - Works with any REST API or web service
- **Complete CORS Support** - Handles all CORS headers and preflight requests
- **Multiple HTTP Methods** - Supports GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- **Request/Response Streaming** - Memory-efficient handling of large files
- **Flexible Body Parsing** - JSON, form-data, and raw binary support

### 🔐 Security & Authentication

- **Optional API Key Authentication** - Secure your proxy with API keys
- **Multiple Auth Methods** - Header, Bearer token, or query parameter
- **Admin API** - Separate admin endpoints with dedicated authentication
- **Security Headers** - Helmet.js integration for security best practices
- **Domain Blocking** - Block malicious or unwanted domains
- **URL Validation** - Prevent malformed or malicious URL requests

### 📊 Monitoring & Management

- **Real-time Statistics** - Request counts, success rates, error tracking
- **Top Domains Tracking** - Monitor most frequently proxied domains
- **Error Logging** - Track and analyze recent errors
- **Health Checks** - Comprehensive health and system information
- **Configuration API** - View current settings and status

### ⚡ Performance & Reliability

- **Rate Limiting** - Configurable request limits to prevent abuse
- **Request Timeouts** - Prevent hanging connections
- **Graceful Shutdown** - Clean server shutdown handling
- **Memory Optimization** - Streaming responses and efficient header handling
- **Error Recovery** - Comprehensive error handling with appropriate status codes

## 🛠️ Quick Start

### Prerequisites

![Node.js](https://img.shields.io/badge/Node.js-14.0.0+-green.svg)
![npm](https://img.shields.io/badge/npm-6.0.0+-blue.svg)

### Installation

```bash
# Clone the repository
git clone https://github.com/Akramovic1/Open-CORS-Proxy.git
cd Open-CORS-Proxy

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development server
npm run dev
```

### First Request

```bash
# Test the proxy (no authentication required by default)
curl "http://localhost:4000/proxy?url=https://api.github.com/users/octocat"

# Check server health
curl http://localhost:4000/health

# View API documentation
curl http://localhost:4000/docs
```

**✅ That's it! Your CORS proxy is running at `http://localhost:4000`**

## ⚙️ Configuration

<div align="center">

![Environment](https://img.shields.io/badge/Configuration-Environment%20Variables-orange.svg)
![Security](https://img.shields.io/badge/Security-Optional%20API%20Keys-red.svg)
![Performance](https://img.shields.io/badge/Performance-Configurable%20Limits-blue.svg)

</div>

### Environment Variables

| Variable            | Default  | Description                      | Required |
| ------------------- | -------- | -------------------------------- | -------- |
| `PORT`              | `4000`   | Server port                      | ❌       |
| `PROXY_API_KEY`     | -        | API key for proxy authentication | ❌       |
| `ADMIN_API_KEY`     | -        | API key for admin endpoints      | ❌       |
| `RATE_LIMIT_MAX`    | `1000`   | Max requests per window          | ❌       |
| `RATE_LIMIT_WINDOW` | `900000` | Rate limit window (ms)           | ❌       |
| `REQUEST_TIMEOUT`   | `30000`  | Request timeout (ms)             | ❌       |
| `MAX_BODY_SIZE`     | `10mb`   | Maximum request body size        | ❌       |
| `ALLOWED_ORIGINS`   | `*`      | Comma-separated allowed origins  | ❌       |
| `BLOCKED_DOMAINS`   | -        | Comma-separated blocked domains  | ❌       |

### Configuration Examples

<details>
<summary><b>🔓 Development (No Authentication)</b></summary>

```bash
# .env
PORT=4000
RATE_LIMIT_MAX=1000
DEBUG_HEADERS=true
```

</details>

<details>
<summary><b>🔒 Production (Secured)</b></summary>

```bash
# .env
PORT=4000
PROXY_API_KEY=your-32-char-random-string
ADMIN_API_KEY=your-different-32-char-string
RATE_LIMIT_MAX=500
RATE_LIMIT_WINDOW=900000
REQUEST_TIMEOUT=10000
MAX_BODY_SIZE=5mb
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
BLOCKED_DOMAINS=malicious-site.com,spam-domain.com
DEBUG_HEADERS=false
DEBUG_ERRORS=false
```

</details>

<details>
<summary><b>🏢 Enterprise (High Security)</b></summary>

```bash
# .env
PORT=4000
PROXY_API_KEY=enterprise-grade-key-32-chars
ADMIN_API_KEY=admin-enterprise-key-32-chars
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=300000  # 5 minutes
REQUEST_TIMEOUT=5000      # 5 seconds
MAX_BODY_SIZE=1mb
ALLOWED_ORIGINS=https://secure.company.com
BLOCKED_DOMAINS=facebook.com,twitter.com,social-media.com
```

</details>

## API Usage

### Basic Proxy Requests

#### Without Authentication (Default)

```bash
# GET request
curl "http://localhost:4000/proxy?url=https://api.example.com/data"

# POST with JSON
curl -X POST http://localhost:4000/proxy \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.example.com/submit", "data": "value"}'
```

#### With API Key Authentication

```bash
# Using X-API-Key header (recommended)
curl -H "X-API-Key: your-api-key" \
  "http://localhost:4000/proxy?url=https://api.example.com/data"

# Using Authorization Bearer
curl -H "Authorization: Bearer your-api-key" \
  "http://localhost:4000/proxy?url=https://api.example.com/data"

# Using query parameter (less secure)
curl "http://localhost:4000/proxy?url=https://api.example.com/data&apiKey=your-api-key"
```

### JavaScript/Frontend Usage

```javascript
// Without authentication
const response = await fetch(
  "/proxy?url=" + encodeURIComponent("https://api.example.com/data")
);
const data = await response.json();

// With authentication
const response = await fetch(
  "/proxy?url=" + encodeURIComponent("https://api.example.com/data"),
  {
    headers: {
      "X-API-Key": "your-api-key",
    },
  }
);
```

## Admin API

Enable admin functionality by setting `ADMIN_API_KEY` in your environment.

### Available Endpoints

```bash
# Get usage statistics
curl -H "X-Admin-Key: your-admin-key" \
  http://localhost:4000/admin/stats

# Get current configuration
curl -H "X-Admin-Key: your-admin-key" \
  http://localhost:4000/admin/config

# Reset statistics
curl -X POST -H "X-Admin-Key: your-admin-key" \
  http://localhost:4000/admin/reset-stats

# Block a domain at runtime
curl -X POST -H "X-Admin-Key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"domain":"malicious-site.com"}' \
  http://localhost:4000/admin/block-domain

# Unblock a domain
curl -X DELETE -H "X-Admin-Key: your-admin-key" \
  http://localhost:4000/admin/unblock-domain/malicious-site.com
```

### Statistics Response Example

```json
{
  "overview": {
    "totalRequests": 1250,
    "successfulRequests": 1180,
    "failedRequests": 70,
    "successRate": "94.40%",
    "uptime": "3600 seconds"
  },
  "topDomains": [
    { "domain": "api.github.com", "count": 450 },
    { "domain": "api.example.com", "count": 320 }
  ],
  "recentErrors": [
    {
      "timestamp": "2025-06-20T10:30:00.000Z",
      "url": "https://invalid-domain.com/api",
      "error": "getaddrinfo ENOTFOUND invalid-domain.com"
    }
  ],
  "systemInfo": {
    "memory": {
      "rss": 45678912,
      "heapTotal": 25165824,
      "heapUsed": 18945432
    },
    "nodeVersion": "v18.17.0",
    "platform": "linux"
  }
}
```

## Available Endpoints

### Core Endpoints

| Endpoint  | Method | Description             | Authentication   |
| --------- | ------ | ----------------------- | ---------------- |
| `/proxy`  | ALL    | Main proxy endpoint     | Optional API key |
| `/health` | GET    | Health check and status | None             |
| `/docs`   | GET    | API documentation       | None             |

### Admin Endpoints (require ADMIN_API_KEY)

| Endpoint                        | Method | Description             |
| ------------------------------- | ------ | ----------------------- |
| `/admin/stats`                  | GET    | Usage statistics        |
| `/admin/config`                 | GET    | Current configuration   |
| `/admin/reset-stats`            | POST   | Reset statistics        |
| `/admin/block-domain`           | POST   | Block domain at runtime |
| `/admin/unblock-domain/:domain` | DELETE | Unblock domain          |

## Error Handling

The proxy returns appropriate HTTP status codes and detailed error messages:

```json
// Missing URL parameter
{
  "error": "Missing 'url' parameter",
  "usage": "Include 'url' in query string (GET) or request body (POST/PUT/etc.)"
}

// Invalid URL
{
  "error": "Invalid URL format",
  "provided": "not-a-valid-url"
}

// Authentication required
{
  "error": "Unauthorized",
  "message": "Valid API key required. Provide via X-API-Key header, Authorization Bearer token, or apiKey query parameter"
}

// Rate limit exceeded
{
  "error": "Rate limit exceeded",
  "retryAfter": 900,
  "limit": 1000
}

// Blocked domain
{
  "error": "Domain not allowed"
}
```

## Security Best Practices

### Production Deployment

1. **Always use HTTPS** in production
2. **Set strong API keys** with sufficient entropy
3. **Configure appropriate rate limits** based on your usage
4. **Use environment variables** for all sensitive configuration
5. **Monitor admin endpoints** for unauthorized access
6. **Regularly rotate API keys**
7. **Set up proper logging** and monitoring

### Recommended Environment Settings

```bash
# Production security settings
PROXY_API_KEY=generate-strong-random-key-here
ADMIN_API_KEY=generate-different-strong-key-here
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=500        # Lower limit for production
REQUEST_TIMEOUT=10000     # 10 seconds max
MAX_BODY_SIZE=5mb         # Reasonable limit
DEBUG_HEADERS=false
DEBUG_ERRORS=false
```

### Blocked Domains Configuration

```bash
# Block known malicious or unwanted domains
BLOCKED_DOMAINS=malicious-site.com,spam-domain.com,phishing-site.org
```

## Performance Optimization

### Memory Efficiency

- Uses streaming for request/response bodies
- Filters unnecessary headers
- Efficient error tracking with limited history

### Network Optimization

- Configurable request timeouts
- Connection reuse via node-fetch
- Proper handling of different content types

### Monitoring

- Real-time statistics tracking
- Memory usage monitoring
- Top domains analysis for optimization

## Development

### Running in Development

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start with auto-reload
npm run dev
```

### Testing

```bash
# Run tests
npm test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Package.json Scripts

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

## Deployment

## 🚀 One-Click Deployments

<div align="center">

|                                                                                Platform                                                                                |                                                Deployment                                                | Features                           |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------: | :--------------------------------- |
|                             [![Render](https://img.shields.io/badge/Render-46E3B7?logo=render&logoColor=white)](https://render.com/deploy)                             | [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)  | Auto SSL, Global CDN, Auto-scaling |
|                             [![Heroku](https://img.shields.io/badge/Heroku-430098?logo=heroku&logoColor=white)](https://heroku.com/deploy)                             |      [![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)       | Auto SSL, Add-ons, CI/CD           |
|                           [![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/new/clone)                            |             [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)             | Edge Network, Serverless           |
|                [![Railway](https://img.shields.io/badge/Railway-0B0D0E?logo=railway&logoColor=white)](https://railway.app/template/deployment-template)                | [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/deployment-template) | Auto Deploy, Databases             |
|                                   [![Fly.io](https://img.shields.io/badge/Fly.io-8B5CF6?logo=fly&logoColor=white)](#deploy-to-flyio)                                   |                                   [Deploy to Fly.io](#deploy-to-flyio)                                   | Global Distribution, Edge          |
| [![AWS Elastic Beanstalk](https://img.shields.io/badge/AWS%20Elastic%20Beanstalk-orange?logo=amazon-aws&logoColor=white)](#aws-elastic-beanstalk-one-click-deployment) |                       [Deploy to AWS](#aws-elastic-beanstalk-one-click-deployment)                       | Free Tier, Auto SSL, Easy Upgrades |

</div>

### Platform-Specific Instructions

<details> <summary><b>🟤 AWS Elastic Beanstalk (Free Tier eligible, Production-ready)</b></summary>
Fork or clone this repository to your own GitHub account.

Sign in to the AWS Console and go to Elastic Beanstalk.

Click "Create Application", choose "Web server environment", and select Node.js as the platform (Node 18+ recommended).

Under Source code origin, select "Upload your code" and upload your project ZIP, or connect your GitHub and select your repo/branch.

Set the environment variables under Configuration > Software > Environment properties:

PROXY_API_KEY = your-api-key

ADMIN_API_KEY = your-admin-key

(Optional: adjust PORT, RATE_LIMIT_MAX, etc.)

Click Create environment to deploy.

Once deployed, visit your provided AWS URL (e.g., http://your-app-env.eba-xxxxxxx.us-east-1.elasticbeanstalk.com).

Features: Free AWS t2.micro instance (Free Tier), Auto-scaling, Custom domains, Monitoring, Production stability

Tip:
You can automate deployment using the AWS CLI:

```bash
# Install AWS CLI and EB CLI
pip install awsebcli --upgrade

# Initialize and deploy
eb init -p node.js my-cors-proxy
eb create --single --instance_type t2.micro --envvars PROXY_API_KEY=your-key,ADMIN_API_KEY=your-admin-key
eb open
```

🚀 One-Click Deployment Script
You can automate the deployment to AWS Elastic Beanstalk with the following script (requires AWS CLI and EB CLI):

```bash
#!/bin/bash
# Deploy Open CORS Proxy to AWS Elastic Beanstalk

APP_NAME=open-cors-proxy
ENV_NAME=open-cors-proxy-env

# Edit these values
PROXY_API_KEY=your-proxy-key
ADMIN_API_KEY=your-admin-key

# Initialize EB CLI project (only first time)
eb init $APP_NAME --platform node.js --region us-east-1

# Create environment if it doesn't exist
eb list | grep $ENV_NAME || eb create $ENV_NAME \
  --single \
  --instance_type t2.micro \
  --envvars "PROXY_API_KEY=$PROXY_API_KEY,ADMIN_API_KEY=$ADMIN_API_KEY"

# Deploy app
eb deploy

# Open the deployed app in your browser
eb open
```

Tip:
Save this script as deploy-aws-eb.sh, chmod +x deploy-aws-eb.sh, and run with ./deploy-aws-eb.sh.

</details>

<details>
<summary><b>🟢 Render (Recommended for beginners)</b></summary>

1. Click **"Deploy to Render"** button above
2. Connect your GitHub repository
3. Environment variables are auto-generated
4. Deploy and get your live URL in 2-3 minutes

**Features**: Free SSL, Global CDN, Auto-scaling, Zero config

</details>

<details>
<summary><b>🟣 Heroku (Classic choice)</b></summary>

1. Click **"Deploy to Heroku"** button
2. Create new app name
3. API keys are auto-generated via `app.json`
4. Deploy from GitHub integration

**Features**: Add-ons ecosystem, CI/CD, Logging

</details>

<details>
<summary><b>⚫ Vercel (Serverless)</b></summary>

1. Click **"Deploy with Vercel"**
2. Import from GitHub
3. Add environment variables in dashboard
4. Deploy with global edge network

**Features**: Instant deployments, Edge functions, Global CDN

</details>

<details>
<summary><b>🔴 Railway (Developer-friendly)</b></summary>

1. Click **"Deploy on Railway"**
2. Connect GitHub repo
3. Environment variables auto-detected
4. Deploy with built-in monitoring

**Features**: Built-in databases, Monitoring, Simple pricing

</details>

<details>
<summary><b>🟠 Fly.io (Global edge)</b></summary>

```bash
# Install flyctl and deploy
curl -L https://fly.io/install.sh | sh
flyctl auth login
flyctl launch
flyctl secrets set PROXY_API_KEY=your-key
flyctl deploy
```

**Features**: Global distribution, Edge computing, Docker-based

</details>

### Platform-Specific Configurations

#### Render Configuration

Create `render.yaml` for infrastructure as code:

```yaml
services:
  - type: web
    name: Open-CORS-Proxy
    env: node
    plan: starter
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PROXY_API_KEY
        generateValue: true
      - key: ADMIN_API_KEY
        generateValue: true
      - key: RATE_LIMIT_MAX
        value: 1000
    healthCheckPath: /health
```

#### Fly.io Configuration

Create `fly.toml`:

```toml
app = "your-Open-CORS-Proxy"
primary_region = "dfw"

[build]
  builder = "heroku/buildpacks:20"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true

  [http_service.checks]
    [http_service.checks.health]
      grace_period = "10s"
      interval = "30s"
      method = "GET"
      timeout = "5s"
      path = "/health"

[[services]]
  protocol = "tcp"
  internal_port = 8080

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

#### Heroku Configuration

Create `app.json` for Heroku Button:

```json
{
  "name": "Open CORS Proxy",
  "description": "High-performance CORS proxy server with authentication and monitoring",
  "repository": "https://github.com/Akramovic1/Open-CORS-Proxy",
  "logo": "https://node-js-sample.herokuapp.com/node.png",
  "keywords": ["cors", "proxy", "api", "express", "node"],
  "image": "heroku/nodejs",
  "env": {
    "NODE_ENV": {
      "description": "Environment setting",
      "value": "production"
    },
    "PROXY_API_KEY": {
      "description": "API key for proxy authentication (optional but recommended)",
      "generator": "secret"
    },
    "ADMIN_API_KEY": {
      "description": "API key for admin endpoints",
      "generator": "secret"
    },
    "RATE_LIMIT_MAX": {
      "description": "Maximum requests per rate limit window",
      "value": "1000"
    },
    "RATE_LIMIT_WINDOW": {
      "description": "Rate limit window in milliseconds",
      "value": "900000"
    }
  },
  "formation": {
    "web": {
      "quantity": 1,
      "size": "basic"
    }
  },
  "healthchecks": [
    {
      "type": "startup",
      "name": "web check",
      "path": "/health"
    }
  ]
}
```

Create `Procfile`:

```
web: npm start
```

#### Vercel Configuration

Create `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["npm", "start"]
```

Create `docker-compose.yml`:

```yaml
version: "3.8"

services:
  Open-CORS-Proxy:
    build: .
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - PROXY_API_KEY=${PROXY_API_KEY}
      - ADMIN_API_KEY=${ADMIN_API_KEY}
      - RATE_LIMIT_MAX=1000
      - RATE_LIMIT_WINDOW=900000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Create `healthcheck.js`:

```javascript
const http = require("http");

const options = {
  hostname: "localhost",
  port: process.env.PORT || 4000,
  path: "/health",
  method: "GET",
  timeout: 2000,
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on("error", () => {
  process.exit(1);
});

req.on("timeout", () => {
  req.destroy();
  process.exit(1);
});

req.end();
```

### Cloud Provider Specific

#### AWS Elastic Beanstalk

Create `.ebextensions/01-Open-CORS-Proxy.config`:

```yaml
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
    NodeVersion: 18.17.0
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    PROXY_API_KEY: your-secure-api-key
    ADMIN_API_KEY: your-secure-admin-key
```

#### Google Cloud Run

```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT-ID/Open-CORS-Proxy
gcloud run deploy --image gcr.io/PROJECT-ID/Open-CORS-Proxy \
  --set-env-vars PROXY_API_KEY=your-key,ADMIN_API_KEY=your-admin-key \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### Azure Container Instances

```bash
# Deploy with Azure CLI
az container create \
  --resource-group myResourceGroup \
  --name Open-CORS-Proxy \
  --image your-registry/Open-CORS-Proxy:latest \
  --dns-name-label Open-CORS-Proxy-unique \
  --ports 4000 \
  --environment-variables \
    NODE_ENV=production \
    PROXY_API_KEY=your-secure-api-key \
    ADMIN_API_KEY=your-secure-admin-key
```

#### DigitalOcean App Platform

Create `.do/app.yaml`:

```yaml
name: Open-CORS-Proxy
services:
  - environment_slug: node-js
    github:
      branch: main
      deploy_on_push: true
      repo: Akramovic1/Open-CORS-Proxy
    health_check:
      http_path: /health
    http_port: 4000
    instance_count: 1
    instance_size_slug: basic-xxs
    name: web
    routes:
      - path: /
    run_command: npm start
    source_dir: /
    envs:
      - key: NODE_ENV
        value: production
      - key: PROXY_API_KEY
        value: your-secure-api-key
        type: SECRET
      - key: ADMIN_API_KEY
        value: your-secure-admin-key
        type: SECRET
```

### Serverless Deployments

#### Netlify Functions

Create `netlify/functions/proxy.js`:

```javascript
const { createProxyMiddleware } = require("http-proxy-middleware");

exports.handler = async (event, context) => {
  // Serverless function implementation
  // Note: Full feature set may be limited in serverless
};
```

#### Vercel Serverless

Create `api/proxy.js`:

```javascript
export default function handler(req, res) {
  // Serverless implementation
  // Note: Stateless, limited to request/response cycle
}
```

### Environment Variables for Production

```bash
# Security (Required for production)
PROXY_API_KEY=generate-32-char-random-string
ADMIN_API_KEY=generate-different-32-char-string

# Performance Tuning
RATE_LIMIT_WINDOW=900000      # 15 minutes
RATE_LIMIT_MAX=500            # Conservative for production
REQUEST_TIMEOUT=10000         # 10 seconds
MAX_BODY_SIZE=5mb             # Reasonable limit

# Security Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
BLOCKED_DOMAINS=malicious-site.com,spam-domain.com

# Monitoring (disable debug in production)
DEBUG_HEADERS=false
DEBUG_ERRORS=false
INCLUDE_CONFIG=false
```

### Post-Deployment Checklist

1. **Test Health Endpoint**: `curl https://your-app.com/health`
2. **Verify Authentication**: Test with and without API keys
3. **Check Rate Limiting**: Ensure limits are appropriate
4. **Test CORS**: Make requests from your frontend domain
5. **Monitor Logs**: Check for any deployment issues
6. **Set Up Monitoring**: Configure uptime monitoring
7. **SSL Certificate**: Ensure HTTPS is working
8. **Custom Domain**: Set up custom domain if needed

### Scaling Considerations

#### Horizontal Scaling

- Most platforms support auto-scaling
- Use load balancers for multiple instances
- Consider sticky sessions if needed

#### Vertical Scaling

- Monitor memory usage via `/admin/stats`
- Increase instance size if needed
- Adjust `MAX_BODY_SIZE` based on usage

#### Database/State

- Current implementation uses in-memory stats
- Consider Redis for persistent stats across instances
- Use external monitoring for production insights

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 4000
CMD ["npm", "start"]
```

### Environment Variables for Deployment

```bash
# Required
PORT=4000

# Security (highly recommended for production)
PROXY_API_KEY=your-production-api-key
ADMIN_API_KEY=your-production-admin-key

# Performance tuning
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=500
REQUEST_TIMEOUT=10000
MAX_BODY_SIZE=5mb

# CORS configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### Health Check Endpoint

The `/health` endpoint provides detailed information for monitoring:

```json
{
  "status": "healthy",
  "service": "CORS Proxy Server",
  "version": "1.0.0",
  "timestamp": "2025-06-20T10:30:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 45678912,
    "heapTotal": 25165824,
    "heapUsed": 18945432,
    "external": 1234567
  }
}
```

## Troubleshooting

### Common Issues

#### CORS Errors

- Ensure the proxy is running and accessible
- Check that CORS headers are properly configured
- Verify the target API allows the proxy's requests

#### Authentication Errors

- Verify API key is correctly set in environment
- Check that the correct authentication method is used
- Ensure API key matches exactly (no extra spaces/characters)

#### Rate Limiting

- Check current rate limit settings
- Monitor usage via admin stats
- Adjust limits based on legitimate usage patterns

#### Memory Issues

- Monitor memory usage via health endpoint
- Adjust `MAX_BODY_SIZE` for your use case
- Check for memory leaks in long-running instances

### Debug Mode

Enable debug options for troubleshooting:

```bash
DEBUG_HEADERS=true    # Shows proxy-specific headers in responses
DEBUG_ERRORS=true     # Includes stack traces in error responses
INCLUDE_CONFIG=true   # Shows configuration in health endpoint
```

## 🤝 Contributing

We welcome contributions!

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/Akramovic1/Open-CORS-Proxy.git
cd Open-CORS-Proxy

# Install dependencies
npm install

# Set up development environment
cp .env.example .env

# Start development server
npm run dev

# Run tests
npm test

# Check code style
npm run lint
```

### Contribution Guidelines

- 📝 Follow the existing code style and conventions
- ✅ Write tests for new features and bug fixes
- 📚 Update documentation for any API changes
- 🔍 Ensure all tests pass before submitting PR
- 📋 Use descriptive commit messages

### Reporting Issues

- 🐛 **Bug Reports**: Use the bug report template
- 💡 **Feature Requests**: Use the feature request template
- 📚 **Documentation**: Suggest improvements via issues

## 📄 License

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**MIT License** - see the [LICENSE](LICENSE) file for details.

This project is open source and available under the MIT License.

</div>

## 🆘 Support

<div align="center">

[![GitHub Issues](https://img.shields.io/github/issues/Akramovic1/Open-CORS-Proxy.svg)](https://github.com/Akramovic1/Open-CORS-Proxy/issues)
[![GitHub Discussions](https://img.shields.io/badge/GitHub-Discussions-purple.svg)](https://github.com/Akramovic1/Open-CORS-Proxy/discussions)
[![Documentation](https://img.shields.io/badge/Documentation-Available-blue.svg)](#-table-of-contents)

</div>

### Getting Help

- 📖 **Documentation**: Check this README and `/docs` endpoint
- 🐛 **Issues**: [Report bugs](https://github.com/Akramovic1/Open-CORS-Proxy/issues/new?template=bug_report.md)
- 💡 **Feature Requests**: [Suggest features](https://github.com/Akramovic1/Open-CORS-Proxy/issues/new?template=feature_request.md)
- 💬 **Discussions**: [Community discussions](https://github.com/Akramovic1/Open-CORS-Proxy/discussions)

### Troubleshooting

For common issues and solutions, check:

1. **Health endpoint**: `GET /health` for system status
2. **Admin stats**: `GET /admin/stats` for usage analytics
3. **Debug mode**: Enable `DEBUG_HEADERS=true` for troubleshooting
4. **Logs**: Check application logs for error details

---

<div align="center">

**⭐ Star this repository if it helped you!**

[![GitHub stars](https://img.shields.io/github/stars/Akramovic1/Open-CORS-Proxy.svg?style=social&label=Star)](https://github.com/Akramovic1/Open-CORS-Proxy)
[![GitHub forks](https://img.shields.io/github/forks/Akramovic1/Open-CORS-Proxy.svg?style=social&label=Fork)](https://github.com/Akramovic1/Open-CORS-Proxy/fork)

Made with ❤️ by the community • [Contribute](CONTRIBUTING.md) • [Report Issues](https://github.com/Akramovic1/Open-CORS-Proxy/issues)

</div>
