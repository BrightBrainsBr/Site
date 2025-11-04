/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  clearMocks: true,
  collectCoverage: true,
  preset: 'ts-jest',
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'node',
}
