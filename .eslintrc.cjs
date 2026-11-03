module.exports = {
  root: true,
  ignorePatterns: ['node_modules/', 'static/**/build/', 'static/**/dist/', '*.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  env: {
    es2022: true
  },
  overrides: [
    {
      files: ['src/**/*.ts'],
      env: { node: true }
    },
    {
      files: ['static/dashboard/src/**/*.{ts,tsx}'],
      env: { browser: true }
    }
  ],
  rules: {
    'no-unused-vars': 'off'
  }
};
