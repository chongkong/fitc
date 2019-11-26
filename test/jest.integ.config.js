module.exports = {
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  testRegex: "\\.integ\\.test\\.ts$",
  moduleFileExtensions: ["js", "json", "ts"],
  globals: {
    "ts-jest": {
      diagnostics: true
    }
  }
};
