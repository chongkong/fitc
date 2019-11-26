module.exports = {
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  testRegex: "\\.unit\\.test\\.ts$",
  moduleFileExtensions: ["js", "json", "ts"],
  globals: {
    "ts-jest": {
      diagnostics: true
    }
  }
};
