const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const child_process = require('child_process')
const express = require('express')
const opn = require('opn')

console.log(chalk.rgb(255, 158, 0)('为防止sw文件互相干扰，每种模式都会使用不同端口号'))

let exec = process.argv[2]

let ExecObj = {
  introduce: runIntroduce,
  normal: runNormal,
  whitoutSkipWaiting: runSkipWaiting,
  whitoutClaim: runClaim,
  message: runMessage
}

const update = (() => {
  let count = 0
  return () => {
    count++
    let handler = str => str.replace(/update serviceWorker \d+ times/g, `update serviceWorker ${count} times`)
    return new Promise((resolve, reject) => {
      Promise.all([
        IO(path.join(__dirname, './dist/index.html'), handler),
        IO(path.join(__dirname, './dist/sw.js'), handler)
      ]).then(() => {
        resolve()
      }).catch(err => reject(err))
    })
  }
})()

function IO (path, handler) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, fd) => {
      if (err) {
        reject(err)
      } else {
        fs.writeFile(path, handler(fd.toString()), err => {
          err ? reject(err) : resolve()
        })
      }
    })
  })
}

function runIntroduce () {
  const Introduction = [
    {
      exec: 'node index.js normal',
      explain: '正常情况，更新[sw]文件会更新所有事件'
    },
    {
      exec: '点击页面update按钮',
      explain: '更新[sw]文件，其实就是加了一个console及更新html内容'
    },
    {
      exec: 'node index.js whitoutSkipWaiting',
      explain: '如果不使用[skipWaiting]方法，[serviceWork]再更新安装文件只会更新[install]事件，其他事件会忽略'
    },
    {
      exec: 'node index.js whitoutClaim',
      explain: '如果不使用[clients.claim]方法，再次更新不会触发[controllerchange]事件，从而只能N＋1次更新'
    },
    {
      exec: 'node index.js message',
      explain: 'web应用与sw间通信'
    }
  ]

  function replace (str) {
    let matchArr = str.match(/\[.+?\]/g)
    let result = str
    if (matchArr && matchArr.length > 0) {
      matchArr.forEach(sub => {
        result = result.replace(sub, chalk.underline.rgb(43, 133, 228)(sub.slice(1, -1)))
      })
    }
    return result
  }
  console.log(chalk.red('命令说明。。。。'), '\n')
  Introduction.forEach(item => {
    console.log(chalk.green(item.exec), ':', replace(item.explain), '\n')
  })
}

function clearFiles (target = path.join(__dirname, './dist')) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(target)) {
      child_process.exec(`rm -rf ${target}/*`, err => err ? reject(err) : resolve())
    } else {
      resolve()
    }
  })
}

function copyFiles (entry, target = path.join(__dirname, './dist')) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(target)) {
      fs.mkdir(target)
    }
    child_process.exec(`cp -r ${entry} ${target}`, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}

function run (entry, port) {
  clearFiles()
    .then(() => {
      copyFiles(entry)
        .then(() => runApp(port))
    }).catch(e => console.log(e))
}

function runApp (port) {
  let app = express()
  app.use(express.static('./dist'))
  app.post('/update', (req, res) => {
    update()
      .then(() => {
        res.json({code: 0, codeMsg: 'success'})
      }).catch(err => {
        console.log(err)
        res.end()
      })
  })
  app.listen(port, (err) => {
    if (err) {
      console.log(err)
    } else {
      opn(`http://127.0.0.1:${port}`)
    }
  })
}

function runNormal () {
  run(path.join(__dirname, './public/normal/*'), 18001)
}

function runSkipWaiting () {
  run(path.join(__dirname, './public/skipWaiting/*'), 18002)
}

function runClaim () {
  run(path.join(__dirname, './public/claim/*'), 18003)
}

function runMessage () {
  run(path.join(__dirname, './public/message/*'), 18004)
}

if (exec in ExecObj) {
  ExecObj[exec]()
}
