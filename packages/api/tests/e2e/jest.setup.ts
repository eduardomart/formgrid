// Jest setup for E2E tests
// This file ensures Jest globals are available

import '@jest/globals';

// Extend global types for Jest
declare global {
    const describe: typeof import('@jest/globals').describe;
    const it: typeof import('@jest/globals').it;
    const expect: typeof import('@jest/globals').expect;
    const beforeAll: typeof import('@jest/globals').beforeAll;
    const afterAll: typeof import('@jest/globals').afterAll;
    const beforeEach: typeof import('@jest/globals').beforeEach;
    const afterEach: typeof import('@jest/globals').afterEach;
}
