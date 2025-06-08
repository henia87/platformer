module.exports = {
  preset: "jest-preset-angular",
  setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
  testMatch: ["<rootDir>/src/**/*.spec.ts"],
  moduleFileExtensions: ["ts", "html", "js", "json"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/app/**/*.ts",
    "!src/main.ts",
    "!src/polyfills.ts",
    "!src/test.ts",
    "!src/environments/**",
    "!src/app/**/*.module.ts",
  ],
};
