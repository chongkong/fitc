module.exports = {
  displayName: "Functions Integration Test",
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  testMatch: ["<rootDir>/**/*.integ.test.ts"],
  moduleFileExtensions: ["js", "json", "ts"],
  modulePaths: ["<rootDir>/node_modules", "<rootDir>/../node_modules"],
  testEnvironment: "node",
  globals: {
    "ts-jest": {
      diagnostics: true
    }
  },
  runner: "jest-serial-runner"
};
