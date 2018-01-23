let Config = {
  info: 'color: #2d8cf0;',
  error: 'color: #ed3f14;',
  success: 'color: #19be6b;',
  tip: 'color: #f8f8f9; background: #1c2438;'
}

Object.keys(Config).forEach(key => {
  if (Config[key].indexOf('font-size') === -1) {
    Config[key] += ' font-size: 15px;'
  }
})
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

console.log('说明： sw文件打印log带下划线，index.js文件log不带下划线', 'tip')

// regist serviceWorker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(register => {
      console.log('register serviceWorker successful', 'success')
      navigator.serviceWorker.addEventListener('controllerchange', e => {
        console.log('broswer receive controllerchange event')
        location.reload()
      })
      navigator.serviceWorker.addEventListener('message', e => {
        console.log('receive message, here is browser. message is ', e.data)
      })
    })
} else {
  console.log('this browser not support serviceWorker', 'error')
}

// update btn
$('.update').onclick = (() => {
  let loading = false
  return () => {
    if (!loading) {
      loading = true
      $http('post', '/update')
        .then(res => {
          loading = false
          console.log(res, 'updated files', 'success')
        }).catch(e => {
          loading = false
          console.log(e, 'update fail', 'error')
        })
    }
  }
})()

$('.add').onclick = () => {
  let script = document.createElement('script')
  document.body.appendChild(script)
  script.src = 'http://apps.bdimg.com/libs/jquery/2.1.4/jquery.min.js'
}

$('.send').onclick = () => {
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage('send message from browser')
  }
}

function $ (selector) {
  let els = document.querySelectorAll(selector)
  return els.length > 1 ? els : els[0]
}

function $http (method, url, data) {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest()
    data && xhr.setHeader('Content-Type', 'application/json')
    data = data ? JSON.stringify(data) : null
    xhr.open(method, url)
    xhr.send(data)
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200 || (xhr.status > 300 && xhr.status <= 304)) {
          resolve(JSON.parse(xhr.responseText))
        } else {
          reject()
        }
      }
    }
  })
}
