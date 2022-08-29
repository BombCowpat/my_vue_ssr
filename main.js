const fetch = require('node-fetch')
console.log(fetch)
fetch('https://v1.hitokoto.cn')
  .then(response => response.json())
  .then(data => {
    console.log(data)
  })
  .catch(console.error)
