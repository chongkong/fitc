module.exports = {
  displayName: "Functions Integration Test",
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  testMatch: [
    "<rootDir>/**/*.integ.test.ts"
  ],
  moduleFileExtensions: ["js", "json", "ts"],
  testEnvironment: "node",
  globals: {
    "ts-jest": {
      diagnostics: true
    }
  },
  runner: "jest-serial-runner",  // Should be run in serial!
  roots: ['<rootDir>/test']
};