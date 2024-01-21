# 自动生成路由配置，支持嵌套路由


## 使用

```ts
import { genRoutes } from '@jl-org/vite-auto-route'
import { createRouter, createWebHistory } from 'vue-router'


const routes = genRoute()
const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
```

> 如果你用的不是 *vite*，并且支持 *node* 环境，请使用`https://www.npmjs.com/package/@jl-org/auto-route`


## 他能做什么？

**自动生成路由配置，支持：**

1. 嵌套路由
2. 路由守卫
3. 路由参数
4. 路由重定向
5. meta


## 规范

<pre>
根文件夹
|-- src
  |-- views
    |-- index.vue
    |-- meta.(ts | js)
    |-- about
      |-- index.vue
      |-- meta.(ts | js)
      |-- nestFloder
        |-- index.vue
        |-- meta.(ts | js)
</pre>

如上图示例，因为 *vite* 的工具，无法使用变量来查找目录

所以你的路由需按照配置写，不能自定义配置

在`/src/views/`下建立你的路由文件吧

`/src/views/index.vue`，会作为路由的首页

`/src/views/about/index.vue`，会作为首页的子路由

*meta* 为可选项


## 如何传递 *meta* ？

在同级目录下，创建一个 *meta.ts* | *meta.js* 文件

并默认导出一个对象，该对象包含了所有需要传递的 *meta* 信息。

## 如何使用嵌套路由 ？

在一个目录下，创建一个新的文件夹，里面包含 *index.vue* 文件即可

## 如果使用路由守卫？

在 *meta.ts* | *meta.js* 文件中，添加一个 *beforeEnter* 函数即可

*beforeEnter* 会被自动提取出来

## 如果使用 *redirect* ？

在 *meta.ts* | *meta.js* 文件中，添加一个 *redirect* 对象即可

*redirect* 会被自动提取出来

## 如何使用 *param* ？

路由参数，$ 代表可选参数
  - *about/[param]*
  - *about/[param$]*