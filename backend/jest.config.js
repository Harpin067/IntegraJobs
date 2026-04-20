/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  moduleFileExtensions: ['js', 'mjs', 'json'],
  clearMocks: true,
  setupFiles: ['<rootDir>/tests/setup.env.js'],
  verbose: true,
};
