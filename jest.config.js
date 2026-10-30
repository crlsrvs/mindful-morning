module.exports = {
  preset: "jest-expo",
  testMatch: ["<rootDir>/tests/**/*.test.ts", "<rootDir>/tests/**/*.test.tsx"],
  clearMocks: true,
  collectCoverageFrom: ["src/domain/**/*.ts", "src/application/**/*.ts"],
  testTimeout: 30000,
};
