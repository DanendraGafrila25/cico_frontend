const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/src/jest.setup.js'],
  testEnvironment: 'jsdom',
  
  // Pastikan moduleNameMapper benar
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  // Pastikan roots dan moduleDirectories benar
  roots: ['<rootDir>'],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  
  testMatch: [
    '**/__test__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '**/?(*.)(test|spec).(js|jsx|ts|tsx)'
  ],
  
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],
  
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/_app.js',
    '!src/**/_document.js',
  ],
  
  // Tambahkan resolver options
  resolver: undefined,
  
  // Pastikan Jest dapat resolve modules
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
};

module.exports = createJestConfig(customJestConfig);