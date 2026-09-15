// ESLint 9 (flat config). Além do recomendado de JS/TS, impõe a regra de
// dependência da spec §2: src/dominio/** não importa de src/dados, src/ui,
// src/app, react nem dexie.
import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const MSG_CAMADA =
  'src/dominio não pode importar de src/dados, src/ui ou src/app (regra de dependência da spec §2).';
const MSG_PACOTE =
  'src/dominio é TypeScript puro: não importa react nem dexie (regra de dependência da spec §2).';
const MSG_ALIAS_DOMINIO =
  'dentro de src/dominio use imports relativos, não o alias @/dominio (regra de dependência da spec §2).';

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'coverage', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { import: importPlugin },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
        node: true,
      },
    },
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          basePath: './src',
          zones: [
            { target: './dominio', from: './dados', message: MSG_CAMADA },
            { target: './dominio', from: './ui', message: MSG_CAMADA },
            { target: './dominio', from: './app', message: MSG_CAMADA },
          ],
        },
      ],
    },
  },
  {
    files: ['src/dominio/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: MSG_PACOTE },
            { name: 'react-dom', message: MSG_PACOTE },
            { name: 'dexie', message: MSG_PACOTE },
            { name: 'dexie-react-hooks', message: MSG_PACOTE },
          ],
          patterns: [
            {
              group: ['react/*', 'react-dom/*', 'dexie/*', '@/dados', '@/dados/*', '@/ui', '@/ui/*', '@/app', '@/app/*'],
              message: MSG_CAMADA,
            },
            {
              group: ['@/dominio', '@/dominio/*'],
              message: MSG_ALIAS_DOMINIO,
            },
          ],
        },
      ],
    },
  },
);
