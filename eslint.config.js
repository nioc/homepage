import js from '@eslint/js'
import eslintPluginSvelte from 'eslint-plugin-svelte'
import pluginPromise from 'eslint-plugin-promise'
import stylisticJs from '@stylistic/eslint-plugin-js'
import globals from 'globals'
import ts from 'typescript-eslint'

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    files: ['**/*.svelte', '**/*.js'],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  pluginPromise.configs['flat/recommended'],
  stylisticJs.configs['all'],
  ...eslintPluginSvelte.configs['flat/recommended'],
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    // See more details at: https://typescript-eslint.io/packages/parser/
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: ts.parser,
      },
    },
  },
  {
    rules: {
      '@stylistic/js/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/js/semi': ['error', 'never'],
      '@stylistic/js/quotes': ['error', 'single'],
      '@stylistic/js/quote-props': ['error', 'as-needed'],
      '@stylistic/js/object-curly-spacing': ['error', 'always'],
      '@stylistic/js/padded-blocks': ['off'],
      '@stylistic/js/function-call-argument-newline': ['error', 'consistent'],
      '@stylistic/js/dot-location': ['error', 'property'],
      '@stylistic/js/indent': ['error', 2],
      '@stylistic/js/lines-around-comment': ['off'],
      '@stylistic/js/implicit-arrow-linebreak': ['off'],
      '@stylistic/js/array-element-newline': ['error', 'consistent'],
      '@stylistic/js/array-bracket-newline': ['error', 'consistent'],
      '@stylistic/js/function-paren-newline': ['off'],
      '@stylistic/js/object-property-newline': ['off', { allowAllPropertiesOnSameLine: true }],
      '@stylistic/js/multiline-comment-style': ['off'],
      '@stylistic/js/no-confusing-arrow': 'off',
    },
  },
]
