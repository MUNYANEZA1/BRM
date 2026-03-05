module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    // allow console in development but warn in production
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  },
};