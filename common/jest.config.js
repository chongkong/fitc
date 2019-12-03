module.exports = {
  displayName: "Common Unit Test",
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  testMatch: [
    '<rootDir>/**/*.unit.test.ts'
  ],
  testEnvironment: "node",
  moduleFileExtensions: ["js", "json", "ts"],
  globals: {
    "ts-jest": {
      diagnostics: true
    }
  },
};
