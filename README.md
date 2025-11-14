# Vite auto route

基于 Vite 文件系统结构自动生成路由配置的工具

## 核心规则

### 动态路由参数

使用方括号语法定义动态参数：

| 文件路径 | 生成的路由路径 | 说明 |
|---------|--------------|------|
| `[id]/page.tsx` | `/:id` | 必选参数 |
| `[id$]/page.tsx` | `/:id?` | 可选参数（以 `$` 结尾） |
| `[...slug]/page.tsx` | `/:slug*` | 捕获所有参数（以 `...` 开头） |

---

## React Router 使用示例

[示例项目](https://github.com/beixiyo/react-tool/blob/main/packages/app/src/router/index.tsx)

```ts
import type { FileSystemRoute } from '@jl-org/vite-auto-route'
import type { ComponentType } from 'react'
import type { RouteObject } from 'react-router'
import { genRoutes } from '@jl-org/vite-auto-route'
import { lazy } from 'react'
import { createBrowserRouter } from 'react-router'
import Index from '@/views'

const pages = genRoutes({
  globComponentsImport: () => import.meta.glob('/src/views/**/page.tsx'),
  indexFileName: '/page.tsx',
  routerPathFolder: '/src/views',
  pathPrefix: /^\/src\/views/,
})

/** 分离首页和其他路由 */
const otherRoutes = pages.filter(item => item.path !== '/')

export const router = createBrowserRouter([
  /** 首页路由 - 独立路由 */
  {
    path: '/',
    Component: Index,
  },
  ...deepToLazy(otherRoutes),
])

function deepToLazy(routes: FileSystemRoute[]): RouteObject[] {
  return routes.map((route) => {
    return {
      path: route.path,
      Component: lazy(async () => {
        const mod = await route.component()
        if (mod && typeof mod === 'object' && 'default' in mod)
          return { default: (mod as { default: ComponentType<any> }).default }
        return { default: mod as ComponentType<any> }
      }),
      children: route.children.length > 0
        ? deepToLazy(route.children)
        : undefined,
    }
  })
}
```

## Vue Router 使用示例

```ts
import { genRoutes } from '@jl-org/vite-auto-route'
import { createRouter, createWebHistory } from 'vue-router'
import Index from '../views/index.vue'

/** 拿到 /src/views 下所有 index.vue 作为路由 */
const views = genRoutes({
  globComponentsImport: () => import.meta.glob('/src/views/**/page.vue'),
  indexFileName: '/page.vue',
  routerPathFolder: '/src/views',
  pathPrefix: /^\/src\/views/,
})
/** 拿到 /src/components 下所有 Test.vue 作为路由 */
const components = genRoutes({
  globComponentsImport: () => import.meta.glob('/src/components/**/Test.vue'),
  indexFileName: '/Test.vue',
  routerPathFolder: '/src/components',
  pathPrefix: /^\/src\/components/,
})

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: Index,
    },
    ...views,
    ...components,
  ],
})
```

---

## 文件树示例

```
src/views/
├── index.tsx                    # 布局组件（不参与路由生成）
├── test/
│   ├── page.tsx                 # /test
│   ├── nested/
│   │   ├── page.tsx             # /test/nested
│   │   └── deep/
│   │       ├── page.tsx         # /test/nested/deep
│   │       └── [id]/
│   │           └── page.tsx     # /test/nested/deep/:id
│   ├── param/
│   │   └── [id]/
│   │       └── page.tsx         # /test/param/:id
│   └── optional/
│       ├── page.tsx             # /test/optional
│       └── [optional$]/
│           └── page.tsx         # /test/optional/:optional?
```

## 生成的路由结构

基于上述文件树，生成的路由配置如下：

```ts
[
  {
    path: '/test',
    name: 'test',
    component: () => import('/src/views/test/page.tsx'),
    children: [
      {
        path: '/test/nested',
        name: 'testNested',
        component: () => import('/src/views/test/nested/page.tsx'),
        children: [
          {
            path: '/test/nested/deep',
            name: 'testNestedDeep',
            component: () => import('/src/views/test/nested/deep/page.tsx'),
            children: [
              {
                path: '/test/nested/deep/:id',
                name: 'testNestedDeepId',
                component: () => import('/src/views/test/nested/deep/[id]/page.tsx'),
                children: []
              }
            ]
          }
        ]
      },
      {
        path: '/test/param/:id',
        name: 'testParamId',
        component: () => import('/src/views/test/param/[id]/page.tsx'),
        children: []
      },
      {
        path: '/test/optional',
        name: 'testOptional',
        component: () => import('/src/views/test/optional/page.tsx'),
        children: [
          {
            path: '/test/optional/:optional?',
            name: 'testOptionalOptional',
            component: () => import('/src/views/test/optional/[optional$]/page.tsx'),
            children: []
          }
        ]
      }
    ]
  }
]
```
