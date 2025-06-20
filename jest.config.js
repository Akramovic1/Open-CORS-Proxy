module.exports = {
  // Test environment
  testEnvironment: "node",

  // Test file patterns
  testMatch: ["**/tests/**/*.test.js", "**/tests/**/*.spec.js"],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: ["server.js", "!node_modules/**", "!tests/**"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],

  // Setup and teardown
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  // Timeout for tests (30 seconds)
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Force exit after tests complete
  forceExit: true,

  // Detect open handles
  detectOpenHandles: true,
};
