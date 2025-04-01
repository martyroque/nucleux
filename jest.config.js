module.exports = {
  preset: 'ts-jest',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.[t|j]sx?$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.preload.js'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['/node_modules/(?!(nanoid|auto-bind))'],
  moduleNameMapper: {
    '^nanoid(/(.*)|$)': 'nanoid$1',
  },
};
