module.exports = {
  content: [ // declaring source files
    './index.html',
    './src/**/*.{svelte,js,ts}',
  ],
  safelist: {
    standard: [
      /$svelte-/, // required for inline component styles
    ],
  },
  variables: true, // remove unused CSS variables
}
