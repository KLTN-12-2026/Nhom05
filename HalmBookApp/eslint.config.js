// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  { ignores: ['dist/**', '.expo/**'] },
  expoConfig,
  { files: ['scripts/**/*.{js,cjs}', 'tests/**/*.cjs'], languageOptions: { globals: { __dirname: 'readonly' } } },
  {
    rules: {
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
]);
