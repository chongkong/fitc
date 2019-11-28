module.exports = {
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  testMatch: [
    '<rootDir>/**/*.integ.test.ts'
  ],
  moduleFileExtensions: ["js", "json", "ts"],
  globals: {
    "ts-jest": {
      diagnostics: true
    }
  }
};
