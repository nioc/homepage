const { purgeCSSPlugin } = require('@fullhuman/postcss-purgecss')
const purgeCSSConfig = require('./purgecss.config.cjs')

module.exports = {
  plugins: [
    purgeCSSPlugin(purgeCSSConfig),
  ],
}
