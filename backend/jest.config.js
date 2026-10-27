/** @type {import('jest').Config} */
const moduleNameMapper = {
  '^@config/(.*)$': '<rootDir>/src/config/$1',
  '^@db/(.*)$': '<rootDir>/src/db/$1',
  '^@modules/(.*)$': '<rootDir>/src/modules/$1',
  '^@shared/(.*)$': '<rootDir>/src/shared/$1',
};

const baseProject = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper,
  setupFiles: ['<rootDir>/tests/helpers/setup-env.ts'],
};

module.exports = {
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts'],
  projects: [
    {
      ...baseProject,
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
    },
    {
      ...baseProject,
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
    },
  ],
};
