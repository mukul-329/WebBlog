import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: [
        'controllers/**/*.js',
        'middleware/**/*.js',
        'routes/**/*.js',
        'models/**/*.js',
      ],
      exclude: [
        'node_modules/**',
        'coverage/**',
      ],
    },
  },
})
