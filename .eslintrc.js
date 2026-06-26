module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2022: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  extends: ['eslint:recommended'],
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    eqeqeq: ['error', 'always'],
  },
  overrides: [
    {
      // Backend uses CommonJS
      files: ['backend/**/*.js'],
      parserOptions: { sourceType: 'script' },
      env: { node: true, browser: false },
    },
    {
      // Frontend + scan-pwa use ES Modules + React
      files: ['frontend/**/*.{js,jsx}', 'scan-pwa/**/*.{js,jsx}'],
      parserOptions: { sourceType: 'module' },
      env: { browser: true, node: false },
    },
  ],
};
