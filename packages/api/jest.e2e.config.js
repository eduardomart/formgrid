module.exports = {
    displayName: 'E2E Tests',
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/tests/e2e/jest.setup.ts'],
    testMatch: ['<rootDir>/tests/e2e/**/*.test.ts'],
    setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup.ts'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/server.ts', // Exclude server entry point
        '!src/queueWorker.ts', // Exclude queue worker
    ],
    coverageDirectory: 'coverage/e2e',
    coverageReporters: ['text', 'lcov', 'html'],
    testTimeout: 30000, // 30 seconds timeout for E2E tests
    maxWorkers: 1, // Run E2E tests sequentially to avoid database conflicts
    verbose: true,
    forceExit: true,
    detectOpenHandles: true,
    // Global setup and teardown
    globalSetup: '<rootDir>/tests/e2e/global-setup.ts',
    globalTeardown: '<rootDir>/tests/e2e/global-teardown.ts',
};
