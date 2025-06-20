module.exports = {
  testEnvironment: "node",
  collectCoverageFrom: ["server.js", "!node_modules/**"],
  coverageReporters: ["text", "lcov", "html"],
  testMatch: ["**/tests/**/*.test.js"],
  verbose: true,
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 30000,
  // Prevent Jest from trying to transform node_fetch
  transformIgnorePatterns: ["node_modules/(?!(node-fetch)/)"],
};
