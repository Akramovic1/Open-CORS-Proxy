// Test setup file
// This file runs before all tests

// Set test environment
process.env.NODE_ENV = "test";

// Disable console logs during tests (optional)
// console.log = jest.fn();
// console.warn = jest.fn();
// console.error = jest.fn();

// Set default test environment variables
process.env.PORT = "0"; // Use random port for tests
process.env.RATE_LIMIT_MAX = "1000";
process.env.RATE_LIMIT_WINDOW = "900000";

// Global test timeout
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  // Reset environment variables that might be set during tests
  delete process.env.PROXY_API_KEY;
  delete process.env.ADMIN_API_KEY;
  delete process.env.BLOCKED_DOMAINS;
  delete process.env.ALLOWED_ORIGINS;
});

// Global teardown
afterAll(() => {
  // Give time for cleanup
  return new Promise((resolve) => setTimeout(resolve, 1000));
});
