const path = require('path')
const { merge } = require('webpack-merge')
const baseConfig = require('./webpack.base.config')
const VueSSRServerPlugin = require('vue-server-renderer/server-plugin')

module.exports = merge(baseConfig, {
  entry: path.resolve(__dirname, '../src/entry-server.js'),
  target: 'node',
  output: {
    libraryTarget: 'commonjs2',
  },
  plugins: [new VueSSRServerPlugin()],
})
