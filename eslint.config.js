import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      'test-results/**',
      'playwright-report/**',
      '.pnpm-store/**',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        performance: 'readonly',
        process: 'readonly',
        URL: 'readonly',
        window: 'readonly',
        document: 'readonly',
      },
    },
  },
);
