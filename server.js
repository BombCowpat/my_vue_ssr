const fs = require('fs')
const path = require('path')
const express = require('express')
const LRU = require('lru-cache')
const { createBundleRenderer } = require('vue-server-renderer')

const isProd = process.env.NODE_ENV === 'production'

const server = express()

const microCache = new LRU({
  max: 100,
  ttl: 5000, // 重要提示：条目在 5 秒后过期。
})
const isCacheable = req => {
  // 实现逻辑为，检查请求是否是用户特定(user-specific)。
  // 只有非用户特定 (non-user-specific) 页面才会缓存
  if (req.url === '/') {
    return true
  } else {
    return false
  }
}

let renderer
let readyPromise
const templatePath = path.resolve(__dirname, './index.template.html')

function createRenderer(bundle, options) {
  return createBundleRenderer(
    bundle,
    Object.assign(options, {
      runInNewContext: false,
    })
  )
}

if (isProd) {
  const bundle = require('./dist/vue-ssr-server-bundle.json')
  const clientManifest = require('./dist/vue-ssr-client-manifest.json')
  const template = fs.readFileSync(templatePath, 'utf-8')
  renderer = createRenderer(bundle, {
    template,
    clientManifest,
  })
} else {
  const setupDevServer = require('./build/setup-dev-server')
  readyPromise = setupDevServer(server, templatePath, (bundle, options) => {
    renderer = createRenderer(bundle, options)
  })
}

server.use('/dist', express.static(path.resolve(__dirname, './dist')))

function render(req, res) {
  const s = Date.now()

  const cacheable = isCacheable(req)
  if (cacheable) {
    const hit = microCache.get(req.url)
    if (hit) {
      return res.end(hit)
    }
  }

  const context = { url: req.url }
  renderer.renderToString(context, (err, html) => {
    if (err) {
      if (err.code === 404) {
        res.status(404).end('Page not found')
      } else {
        res.status(500).end('Internal Server Error')
      }
    } else {
      if (cacheable) {
        microCache.set(req.url, html)
      }
      if (!isProd) {
        console.log(`whole request: ${Date.now() - s}ms`)
      }
      res.end(html)
    }
  })
}

server.get('*', (req, res) => {
  if (isProd) {
    render(req, res)
  } else {
    readyPromise.then(() => render(req, res))
  }
})

server.listen(8088, () => {
  console.log('http://localhost:8088')
})
