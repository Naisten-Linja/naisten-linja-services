// This configuration is only for backend tests. The frontend test configuration is handled by react-scripts.

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // [...]
  transform: {
    '.*.ts': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.backend.json',
      },
    ],
  },
  testMatch: ['<rootDir>/src/backend/**/?(*.)+(spec|test).[jt]s?(x)'],
  watchPathIgnorePatterns: [
    '<rootDir>/src/frontend',
    '<rootDir>/build',
    '<rootDir>/db-data',
    '<rootDir>/patches',
    '<rootDir>/public',
    '<rootDir>/redis-data',
    '<rootDir>/node_modules',
  ],
  testEnvironment: 'node',
  // Allow sufficient time to download test containers
  testTimeout: 60000,
  setupFilesAfterEnv: ['jest-extended/all'],
};
