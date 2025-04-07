# 自动生成路由配置，支持嵌套路由

## 安装

```bash
npm i @jl-org/vite-auto-route
```

---


## 他能做什么？

**自动生成路由配置，支持：**

1. 嵌套路由
2. 路由守卫
3. 路由参数
4. 路由重定向
5. meta


## 使用

**如果遇到数组没有匹配到路由，请先删除 `/node_modules/.vite` 文件夹，再重新编译**

### Vue
```ts
import { genRoutes } from '@jl-org/vite-auto-route'
import { createRouter, createWebHistory } from 'vue-router'

// Vue 开箱即用，默认读取 /src/views/**/index.vue
// 如果需要读取其他文件夹，请看 React 示例
const routes = genRoute()

/** 未匹配路径处理 */
routes.push({
  path: '/:pathMatch(.*)*',
  redirect: '/YourPath',
} as any)

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
```


### React
```ts
import { genRoutes } from '@jl-org/vite-auto-route'

// 拿到 /src/views 下所有 index.tsx 作为路由
const views = genRoutes({
  globComponentsImport: () => import.meta.glob('/src/views/**/index.tsx'),
  indexFileName: '/index.tsx',
  routerPathFolder: '/src/views',
  pathPrefix: /^\/src\/views/,
})
// 拿到 /src/components 下所有 Test.tsx 作为路由
const components = genRoutes({
  globComponentsImport: () => import.meta.glob('/src/components/**/Test.tsx'),
  indexFileName: '/Test.tsx',
  routerPathFolder: '/src/components',
  pathPrefix: /^\/src\/components/,
})

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Index />, // 路由入口

    children: [
      {
        path: '/',
        element: <AnimateRoute />,
        children: views.concat(components), // 所有路由
      },
    ],
  },
])
```

如果你用的不是 *vite*，并且支持 *node* 环境，请使用`https://www.npmjs.com/package/@jl-org/auto-route`


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

如上图示例目录结构所示

推荐在`/src/views/`下建立你的路由文件

`/src/views/index.vue`，会作为路由的首页，且必须存在

`/src/views/about/index.vue`，会作为首页的子路由

*meta* 为可选项

## 我不想让 `src/views/index.vue` 作为首页怎么办？

当你可能需要 `/home` 作为首页，那么你可以进行如下配置

首先，`src/views/index.vue` 必须创建，你里面可以不写东西，比如
```html
<template></template>
```

创建 `src/views/meta.{j,t}s` 文件，里面写上重定向即可  
然后你就可以在 `src/views/home/index.vue` 编写你的首页了
```ts
export default {
    redirect: '/home',
}
```



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