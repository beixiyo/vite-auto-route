# Vite auto route

基于 Vite 文件系统结构自动生成路由配置的工具

## 核心规则

### 动态路由参数

使用方括号语法定义动态参数：

| 文件路径 | 生成的路由路径 | 说明 |
|---------|--------------|------|
| `[id]/page.tsx` | `/:id` | 必选参数 |
| `[id$]/page.tsx` | `/:id?` | 可选参数（以 `$` 结尾） |
| `[...slug]/page.tsx` | `/**` | 捕获所有参数（以 `...` 开头）；在 @jl-org/react-router 中通过 `params.splat`（数组）读取完整剩余路径 |

> 参数名须为合法标识符（字母 / `_` / `$` 开头），如 `[2fa]`、`[a.b]` 这类非法名会在构建期直接报错，避免运行时崩溃。

---

## React Router 使用示例

[示例项目](https://github.com/beixiyo/react-tool/blob/main/packages/app/src/router/index.tsx)

```ts
import { genRoutes } from '@jl-org/vite-auto-route'
import { lazy } from 'react'
import { createBrowserRouter } from 'react-router'
import Index from '@/views'

export const pages = genRoutes({
  globComponentsImport: () => import.meta.glob('/src/views/**/page.tsx'),
  indexFileName: '/page.tsx',
  routerPathFolder: '/src/views',
  pathPrefix: /^\/src\/views/,
  customizeRoute: (context) => (route) => {
    // 必须展开 ...route，否则会丢掉已经生成好的 children（嵌套路由全部消失）
    return {
      ...route,
      Component: lazy(route.component),
      // ... anything you want
    }
  },
  extendRoutes: (routes) => {
    routes.push({
      path: '/',
      Component: Index,
    } as any)
    return routes
  }
})

export const router = createBrowserRouter(pages)
```

> 提示：`@jl-org/react-router` 的 `route.component` 可直接接受 `import.meta.glob` 返回的 loader（`() => Promise<{ default }>`），此时无需 `customizeRoute` / `lazy` 转换，直接 `createBrowserRouter({ routes: pages })` 即可。上面的 `lazy` 写法用于官方 `react-router`。

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

## 高级配置

### 路由自定义选项

`genRoutes` 提供了三个配置选项，用于在不同阶段自定义路由生成：

#### 1. `customizeRoute` - 简单字段修改（推荐）

**执行顺序：最早**，在 `transformRoute` 之前执行

**适用场景：**
- 添加或修改路由字段（如 `middlewares`、`meta`）
- 基于路径、名称等简单条件进行字段设置
- 不需要过滤或拆分路由的场景

**特点：**
- 只能修改单个路由，不能过滤或拆分
- 返回类型固定为 `FileSystemRoute`
- API 设计更简洁，适合简单场景

```ts
export const pages = genRoutes({
  globComponentsImport: () => import.meta.glob('/src/views/**/page.tsx'),
  indexFileName: '/page.tsx',
  routerPathFolder: '/src/views',
  pathPrefix: /^\/src\/views/,
  customizeRoute: (context) => {
    return (route) => {
      if (route.path !== '/') {
        return {
          ...route,
          // ... anything you want
        }
      }

      return route
    }
  },
})
```

#### 2. `transformRoute` - 复杂转换逻辑

**执行顺序：中间**，在 `customizeRoute` 之后执行

**适用场景：**
- 需要过滤掉某些路由（返回 `null`）
- 需要将一个路由拆分成多个路由（返回数组）
- 需要复杂的转换逻辑
- 需要基于路由结构进行深度修改

**特点：**
- 可以返回 `null` 来过滤路由
- 可以返回数组来拆分路由
- 功能更强大，适合复杂场景

```ts
const routes = genRoutes({
  globComponentsImport: () => import.meta.glob('/src/views/**/page.tsx'),
  indexFileName: '/page.tsx',
  routerPathFolder: '/src/views',
  pathPrefix: /^\/src\/views/,
  transformRoute: (route, context) => {
    // 过滤掉某些路由
    if (route.path.startsWith('/internal')) {
      return null
    }
    // 将一个路由拆分成多个
    if (route.path === '/multi') {
      return [
        { ...route, path: '/multi/a' },
        { ...route, path: '/multi/b' }
      ]
    }
    return route
  },
})
```

#### 3. `extendRoutes` - 全局操作

**执行顺序：最后**，在所有路由转换完成后执行

**适用场景：**
- 添加全局路由（如 404 页面、错误页面）
- 对路由数组进行排序
- 全局级别的路由处理
- 需要访问完整路由树的场景

**特点：**
- 接收整个路由数组，可以添加、删除、重新排序
- 在单个路由转换完成后执行
- 适合全局级别的操作

```ts
const routes = genRoutes({
  globComponentsImport: () => import.meta.glob('/src/views/**/page.tsx'),
  indexFileName: '/page.tsx',
  routerPathFolder: '/src/views',
  pathPrefix: /^\/src\/views/,
  extendRoutes: (routes) => {
    // 添加 404 路由
    routes.push({
      path: '*',
      name: 'notFound',
      component: () => import('./views/404'),
      children: [],
      rawPath: '',
      segments: [],
      rawSegments: [],
    })
    // 对路由进行排序
    return routes.sort((a, b) => a.path.localeCompare(b.path))
  },
})
```

### 执行顺序

三个配置选项的执行顺序如下：

```
customizeRoute → transformRoute → extendRoutes
```

它们可以同时使用，按上述顺序执行，不会冲突。

### 自定义路由名称

使用 `resolveRouteName` 可以自定义路由名称的生成策略：

```ts
const routes = genRoutes({
  globComponentsImport: () => import.meta.glob('/src/views/**/page.tsx'),
  indexFileName: '/page.tsx',
  routerPathFolder: '/src/views',
  pathPrefix: /^\/src\/views/,
  resolveRouteName: (context) => {
    // 自定义名称生成逻辑
    if (context.isRoot) {
      return 'root'
    }
    return context.segments
      .map(s => s.replace(/[:?*]/g, ''))
      .join('-')
  },
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

> 两条规则：
> 1. **参数提升（spill）**：当静态父节点自身有 `page`（component）时，其下的「参数子路由」会从父的 `children` 中**提升为兄弟节点**（如 `:id` 与 `deep` 平级、`:optional?` 与 `optional` 平级），避免父级被迫充当布局；静态子路由仍正常嵌套。
> 2. **同级排序**：同一层按「静态 < 动态 < 可选 < catchAll」排序，同类再按字母序，保证更具体的路由先于更宽泛的被匹配。

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
            children: []
          },
          // [id] 被提升为 deep 的兄弟（而非嵌进 deep.children）
          {
            path: '/test/nested/deep/:id',
            name: 'testNestedDeepId',
            component: () => import('/src/views/test/nested/deep/[id]/page.tsx'),
            children: []
          }
        ]
      },
      {
        path: '/test/optional',
        name: 'testOptional',
        component: () => import('/src/views/test/optional/page.tsx'),
        children: []
      },
      // [optional$] 被提升为 optional 的兄弟
      {
        path: '/test/optional/:optional?',
        name: 'testOptionalOptional',
        component: () => import('/src/views/test/optional/[optional$]/page.tsx'),
        children: []
      },
      {
        path: '/test/param/:id',
        name: 'testParamId',
        component: () => import('/src/views/test/param/[id]/page.tsx'),
        children: []
      }
    ]
  }
]
```

## 开发与测试

```bash
pnpm test          # 运行 vitest 单测（test/ 目录）
pnpm --dir playground install && pnpm --dir playground dev   # 启动可视化 Playground（真实 react-router 导航 Demo）
```
