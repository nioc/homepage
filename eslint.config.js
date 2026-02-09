import js from '@eslint/js'
import eslintPluginSvelte from 'eslint-plugin-svelte'
import pluginPromise from 'eslint-plugin-promise'
import stylistic from '@stylistic/eslint-plugin'
import depend from 'eslint-plugin-depend'
import globals from 'globals'
import ts from 'typescript-eslint'

export default [
  // Recommended rules
  js.configs.recommended,
  ...ts.configs.recommended,
  ...eslintPluginSvelte.configs['flat/recommended'],
  pluginPromise.configs['flat/recommended'],
  depend.configs['flat/recommended'],
  stylistic.configs['recommended'],

  // JS/TS rules
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      parser: ts.parser,
      parserOptions: {
        projectService: false,
      },
      globals: globals.browser,
    },
    plugins: {
      stylistic,
      promise: pluginPromise,
      depend,
    },
    rules: {
      'stylistic/comma-dangle': ['error', 'always-multiline'],
      'stylistic/semi': ['error', 'never'],
      'stylistic/quotes': ['error', 'single'],
      'stylistic/quote-props': ['error', 'as-needed'],
      'stylistic/object-curly-spacing': ['error', 'always'],
      'stylistic/padded-blocks': ['off'],
      'stylistic/function-call-argument-newline': ['error', 'consistent'],
      'stylistic/dot-location': ['error', 'property'],
      'stylistic/indent': ['error', 2],
      'stylistic/lines-around-comment': ['off'],
      'stylistic/implicit-arrow-linebreak': ['off'],
      'stylistic/array-element-newline': ['error', 'consistent'],
      'stylistic/array-bracket-newline': ['error', 'consistent'],
      'stylistic/function-paren-newline': ['off'],
      'stylistic/object-property-newline': ['off', { allowAllPropertiesOnSameLine: true }],
      'stylistic/multiline-comment-style': ['off'],
      'stylistic/no-confusing-arrow': 'off',
      'depend/ban-dependencies': ['error', {
        allowed: ['js-yaml'], // alternative is larger
      }],
    },
  },

  // Svelte rules
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: eslintPluginSvelte.parser,
      parserOptions: {
        parser: ts.parser,
        extraFileExtensions: ['.svelte'],
        projectService: false,
      },
      globals: globals.browser,
    },
    plugins: {
      svelte: eslintPluginSvelte,
      stylistic,
      promise: pluginPromise,
      depend,
    },
    rules: {
      'stylistic/comma-dangle': ['error', 'always-multiline'],
      'stylistic/semi': ['error', 'never'],
      'stylistic/quotes': ['error', 'single'],
      'stylistic/quote-props': ['error', 'as-needed'],
      'stylistic/object-curly-spacing': ['error', 'always'],
      'stylistic/padded-blocks': ['off'],
      'stylistic/function-call-argument-newline': ['error', 'consistent'],
      'stylistic/dot-location': ['error', 'property'],
      'stylistic/indent': ['error', 2],
      'stylistic/lines-around-comment': ['off'],
      'stylistic/implicit-arrow-linebreak': ['off'],
      'stylistic/array-element-newline': ['error', 'consistent'],
      'stylistic/array-bracket-newline': ['error', 'consistent'],
      'stylistic/function-paren-newline': ['off'],
      'stylistic/object-property-newline': ['off', { allowAllPropertiesOnSameLine: true }],
      'stylistic/multiline-comment-style': ['off'],
      'stylistic/no-confusing-arrow': 'off',
      'depend/ban-dependencies': ['error', {
        allowed: ['js-yaml'], // alternative is larger
      }],
    },
  },
]
