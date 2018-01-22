let Config = {
  info: 'color: #5cadff;',
  error: 'color: #ed3f14;',
  success: 'color: #19be6b;',
  tip: 'color: #1c2438; background: #f8f8f9;'
}

Object.keys(Config).forEach(key => {
  if (Config[key].indexOf('font-size') === -1) {
    Config[key] += ' font-size: 12px; text-decoration:underline;'
  }
})
let log = console.log
// 重写console，默认样式为info，具体参照Config
console.log = (function () {
  let log = console.log
  return function () {
    let arg = Array.prototype.slice.call(arguments)
    let style = 'info'
    if (arg[arg.length - 1] in Config) {
      style = arg.pop()
    }
    log.call(null, '%c' + arg.map(item => typeof item === 'object' ? JSON.stringify(item) : item).join(' '), Config[style])
  }
})()

console.log('update serviceWorker 1 times', 'tip')

const CacheName = 'test'
const CacheList = ['./index.js', './index.html'] // install can`t add cross-domain file
let savedList = new Set()

self.addEventListener('install', event => {
  console.log('emit install event')
  event.waitUntil(
    caches.open(CacheName)
      .then(cache => {
        return Promise.all(CacheList.map(url => {
          let req = new Request(url)
          savedList.add(req.url)
          fetch(req)
            .then(res => res.ok && cache.put(req, res.clone())) // put is async
        }))
      })
      .then(() => {
        console.log('add all file to cache', 'success')
        skipWaiting()
      })
  )
})

self.addEventListener('activate', event => {
  console.log('emit activate event')
  event.waitUntil(
    caches.open(CacheName)
      .then(cache => {
        cache.keys().then(reqs => {
          return Promise.all(reqs.filter(req => {
            console.log(`req url is ${req.url}`)
            return !savedList.has(req.url)
          }).map(req => {
            console.log(`delete ${req.url}`)
            return cache.delete(req)
          }))
        })
        .then(() => {
          console.log('clear unnecessary cache')
          clients.claim()
        })
      })
  )
})

self.addEventListener('fetch', event => {
  console.log('emit fetch event')
  if (event.request.method.toLowerCase() === 'get') {
    event.respondWith(
      caches.open(CacheName)
        .then(cache => {
          return cache.match(event.request)
            .then(res => {
              res && console.log('fetch from cache')
              return res || fetch(event.request)
                .then(response => {
                  console.log('fetch from server')
                  response.ok && cache.put(event.request, response.clone())
                  return response
                })
            })
        })
    )
  }
})
