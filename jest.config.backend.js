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
  testMatch: ['**/src/backend/**/?(*.)+(spec|test).[jt]s?(x)'],
  testEnvironment: 'node',
  // Allow sufficient time to download test containers
  testTimeout: 60000,
  setupFilesAfterEnv: ['jest-extended/all'],
};
