const fs = require('fs')
const path = require('path')
const express = require('express')
const LRU = require('lru-cache')
const { createBundleRenderer } = require('vue-server-renderer')
const serverBundle = require('./dist/vue-ssr-server-bundle.json')
const clientManifest = require('./dist/vue-ssr-client-manifest.json')

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

const renderer = createBundleRenderer(serverBundle, {
  runInNewContext: false,
  template: fs.readFileSync('./index.template.html', 'utf-8'),
  clientManifest,
})

server.use('/dist', express.static(path.resolve(__dirname, './dist')))

server.get('*', (req, res) => {
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
      res.end(html)
    }
  })
})

server.listen(8088, () => {
  console.log('http://localhost:8088')
})
