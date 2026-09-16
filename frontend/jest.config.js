const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/e2e/'],
};

module.exports = createJestConfig(customJestConfig);
