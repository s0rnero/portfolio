import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import tailwind from 'eslint-plugin-better-tailwindcss'
import prettier from 'eslint-plugin-prettier/recommended'
import vue from 'eslint-plugin-vue'

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.agents/**',
      'scripts/**',
      'src/vendor/**',
      'public/game/**',
    ],
  },
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.vue'],
    ...tailwind.configs['flat/recommended'],
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/style.css',
      },
    },
  },
  prettier,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
  {
    rules: {
      'vue/require-default-prop': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/no-required-prop-with-default': 'off',
      'vue/no-v-text-v-html-on-component': 'off',
      'vue/component-name-in-template-casing': [
        'error',
        'kebab-case',
        { registeredComponentsOnly: false },
      ],
      'vue/attributes-order': [
        'error',
        {
          order: [
            'DEFINITION',
            [
              'LIST_RENDERING',
              'CONDITIONALS',
              'RENDER_MODIFIERS',
              'SLOT',
              'TWO_WAY_BINDING',
              'OTHER_DIRECTIVES',
            ],
            'ATTR_DYNAMIC',
            ['GLOBAL', 'UNIQUE', 'ATTR_STATIC'],
            'ATTR_SHORTHAND_BOOL',
            'EVENTS',
            'CONTENT',
          ],
        },
      ],
      'prettier/prettier': 'error',
    },
  },
]
