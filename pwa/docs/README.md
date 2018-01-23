## PWA之serviceWorker
1. [什么是serviceWorker](https://developer.mozilla.org/zh-CN/docs/Web/API/ServiceWorker)
  * 如何注册？
  * 生命周期？

### 操作指南
```sh
# see package.json
npm run introduce
```
server大致原理
1. 解析指令
2. run指令将public下对应目录复制到dist下，并起一个express服务
3. express提供dist目录静态服务
4. update接口读写一下html、sw文件中更新次数
5. 每个run指令需要跑在不同端口，防止sw污染

sw大致原理
1. install时将指定文件添加至缓存，所以第一次打开应用fetch来自server
2. activate时将不需要的缓存删除，示例是删除非指定文件列表
3. fetch拦截get请求，不存在则请求并缓存

注意对比
1. skipWaiting更新后不激活
