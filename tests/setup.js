// Global test setup
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = "test";

  // Disable console.log during tests to reduce noise
  if (process.env.SILENT_TESTS === "true") {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
});

afterAll(() => {
  // Cleanup after all tests
  delete process.env.NODE_ENV;
});
