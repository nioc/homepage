const { purgeCSSPlugin } = require('@fullhuman/postcss-purgecss')

module.exports = {
  plugins: [
    purgeCSSPlugin({
      content: [
        './index.html',
        './src/**/*.{svelte,js,ts}',
      ], // declaring source files
      safelist: {
        standard: [/$svelte-/], // required for inline component styles
      },
      variables: true, // remove unused CSS variables
    }),
  ],
}
