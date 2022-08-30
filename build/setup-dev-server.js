const fs = require('fs')
const path = require('path')
const MFS = require('memory-fs')
const chokidar = require('chokidar')
const webpack = require('webpack')
const middleware = require('webpack-dev-middleware')
const clientConfig = require('./webpack.client.config')
const serverConfig = require('./webpack.server.config')

const readFile = (fs, file) => {
  try {
    return fs.readFileSync(path.join(clientConfig.output.path, file), 'utf-8')
  } catch (e) {}
}

module.exports = function setupDevServer(server, templatePath, cb) {
  let bundle
  let template
  let clientManifest

  let ready
  const readyPromise = new Promise(resolve => {
    ready = resolve
  })

  const update = () => {
    if (bundle && clientManifest) {
      ready()
      cb(bundle, {
        template,
        clientManifest,
      })
    }
  }

  // read template from disk and watch
  template = fs.readFileSync(templatePath, 'utf-8')
  chokidar.watch(templatePath).on('change', () => {
    template = fs.readFileSync(templatePath, 'utf-8')
    console.log('index.html template updated.')
    update()
  })

  // dev middleware
  const clientCompiler = webpack(clientConfig)
  const devMiddleware = middleware(clientCompiler, {
    publicPath: clientConfig.output.publicPath,
  })
  server.use(devMiddleware)

  // 在devMiddleware钩子中获取clientManifest
  devMiddleware.waitUntilValid(() => {
    clientManifest = JSON.parse(devMiddleware.context.outputFileSystem.readFileSync(path.join(clientConfig.output.path, 'vue-ssr-client-manifest.json'), 'utf-8'))
    update()
  })
  // 在webapck钩子中获取clientManifest
  /* clientCompiler.hooks.done.tap('MyPlugin', stats => {
    stats = stats.toJson()
    stats.errors.forEach(err => console.error(err))
    stats.warnings.forEach(err => console.warn(err))
    if (stats.errors.length) return
    clientManifest = JSON.parse(devMiddleware.context.outputFileSystem.readFileSync(path.join(clientConfig.output.path, 'vue-ssr-client-manifest.json'), 'utf-8'))
    update()
  }) */

  // watch and update server renderer
  const serverCompiler = webpack(serverConfig)
  const mfs = new MFS()
  serverCompiler.outputFileSystem = mfs
  serverCompiler.watch({}, (err, stats) => {
    if (err) throw err
    stats = stats.toJson()
    if (stats.errors.length) return

    // read bundle generated by vue-ssr-webpack-plugin
    bundle = JSON.parse(readFile(mfs, 'vue-ssr-server-bundle.json'))
    update()
  })
  return readyPromise
}
