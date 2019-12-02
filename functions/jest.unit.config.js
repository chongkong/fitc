module.exports = {
  displayName: "Functions Unit Test",
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  testMatch: [
    "<rootDir>/**/*.unit.test.ts"
  ],
  moduleFileExtensions: ["js", "json", "ts"],
  testEnvironment: "node",
  globals: {
    "ts-jest": {
      diagnostics: true
    }
  },
  roots: ["<rootDir>/src"]
};
