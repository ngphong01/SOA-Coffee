module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/integration/**/*.test.js',
    '**/services/*/tests/**/*.test.js',
  ],
  collectCoverageFrom: [
    'services/*/src/**/*.js',
    'api-gateway/src/**/*.js',
    'shared/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/migrations/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterSetup: [],
  verbose: true,
  testTimeout: 10000,
};
