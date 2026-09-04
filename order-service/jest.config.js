/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  // Our saga tests boot real service processes and hit a real Postgres,
  // so they cannot run in parallel against the same DBs.
  maxWorkers: 1,
  testTimeout: 120000,
  forceExit: true,
  detectOpenHandles: false,
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  clearMocks: true,
  // `razorpay` is only installed in payment-service, not order-service.
  // Map it to our controllable fake so the in-process Payment service
  // uses a deterministic SDK (success/failure) without any real network.
  moduleNameMapper: {
    '^razorpay$': '<rootDir>/tests/__mocks__/razorpay.js',
  },
};
