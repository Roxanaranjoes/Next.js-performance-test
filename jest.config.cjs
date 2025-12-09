/** @type {import('jest').Config} */
module.exports = {
  // Use ts-jest so we can test TS/TSX files directly.
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1", // Support path aliases from tsconfig.
    "\\.(css|less|scss|sass)$": "identity-obj-proxy", // Stub CSS imports.
  },
  testMatch: ["**/__tests__/**/*.(test|spec).(ts|tsx)"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
  // Keep the output clean for readability.
  verbose: false,
};
