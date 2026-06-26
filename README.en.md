# Vite auto route

A tool that automatically generates route configuration from your Vite file-system structure

[中文](./README.md) | [Changelog](./CHANGELOG.md)

## Core Rules

### Dynamic Route Parameters

Use bracket syntax to define dynamic parameters:

| File Path | Generated Route Path | Description |
|---------|--------------|------|
| `[id]/page.tsx` | `/:id` | Required parameter |
| `[id$]/page.tsx` | `/:id?` | Optional parameter (ends with `$`) |
| `[...slug]/page.tsx` | `/**` | Catch-all parameter (starts with `...`); in @jl-org/react-router the full remaining path is read via `params.splat` (an array) |

> Parameter names must be valid identifiers (starting with a letter / `_` / `$`). Illegal names such as `[2fa]` or `[a.b]` fail at build time, preventing runtime crashes.

---

## React Router Usage Example

[Example project](https://github.com/beixiyo/react-tool/blob/main/packages/app/src/router/index.tsx)

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
    // You must spread ...route, otherwise the already-generated children are lost (all nested routes disappear)
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

> Tip: `@jl-org/react-router`'s `route.component` can directly accept the loader returned by `import.meta.glob` (`() => Promise<{ default }>`). In that case there's no need for the `customizeRoute` / `lazy` conversion — just call `createBrowserRouter({ routes: pages })`. The `lazy` form above is for the official `react-router`.

## Vue Router Usage Example

```ts
import { genRoutes } from '@jl-org/vite-auto-route'
import { createRouter, createWebHistory } from 'vue-router'
import Index from '../views/index.vue'

/** Grab every index.vue under /src/views as a route */
const views = genRoutes({
  globComponentsImport: () => import.meta.glob('/src/views/**/page.vue'),
  indexFileName: '/page.vue',
  routerPathFolder: '/src/views',
  pathPrefix: /^\/src\/views/,
})
/** Grab every Test.vue under /src/components as a route */
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

## Advanced Configuration

### Route Customization Options

`genRoutes` provides three configuration options for customizing route generation at different stages:

#### 1. `customizeRoute` - Simple field modifications (recommended)

**Execution order: earliest** — runs before `transformRoute`

**Use cases:**
- Add or modify route fields (such as `middlewares`, `meta`)
- Set fields based on simple conditions like path or name
- Scenarios that don't require filtering or splitting routes

**Characteristics:**
- Can only modify a single route; cannot filter or split
- Return type is fixed as `FileSystemRoute`
- Simpler API design, suited to simple scenarios

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

#### 2. `transformRoute` - Complex transformation logic

**Execution order: middle** — runs after `customizeRoute`

**Use cases:**
- Need to filter out certain routes (return `null`)
- Need to split one route into multiple routes (return an array)
- Need complex transformation logic
- Need deep modifications based on route structure

**Characteristics:**
- Can return `null` to filter out a route
- Can return an array to split a route
- More powerful, suited to complex scenarios

```ts
const routes = genRoutes({
  globComponentsImport: () => import.meta.glob('/src/views/**/page.tsx'),
  indexFileName: '/page.tsx',
  routerPathFolder: '/src/views',
  pathPrefix: /^\/src\/views/,
  transformRoute: (route, context) => {
    // Filter out certain routes
    if (route.path.startsWith('/internal')) {
      return null
    }
    // Split one route into multiple
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

#### 3. `extendRoutes` - Global operations

**Execution order: last** — runs after all route transformations are complete

**Use cases:**
- Add global routes (such as 404 pages, error pages)
- Sort the route array
- Global-level route handling
- Scenarios that need access to the complete route tree

**Characteristics:**
- Receives the entire route array; can add, remove, and reorder
- Runs after individual route transformations complete
- Suited to global-level operations

```ts
const routes = genRoutes({
  globComponentsImport: () => import.meta.glob('/src/views/**/page.tsx'),
  indexFileName: '/page.tsx',
  routerPathFolder: '/src/views',
  pathPrefix: /^\/src\/views/,
  extendRoutes: (routes) => {
    // Add a 404 route
    routes.push({
      path: '*',
      name: 'notFound',
      component: () => import('./views/404'),
      children: [],
      rawPath: '',
      segments: [],
      rawSegments: [],
    })
    // Sort the routes
    return routes.sort((a, b) => a.path.localeCompare(b.path))
  },
})
```

### Execution Order

The three configuration options execute in the following order:

```
customizeRoute → transformRoute → extendRoutes
```

They can be used together; they run in the order above without conflicts.

### Customizing Route Names

Use `resolveRouteName` to customize the route name generation strategy:

```ts
const routes = genRoutes({
  globComponentsImport: () => import.meta.glob('/src/views/**/page.tsx'),
  indexFileName: '/page.tsx',
  routerPathFolder: '/src/views',
  pathPrefix: /^\/src\/views/,
  resolveRouteName: (context) => {
    // Custom name generation logic
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

## File Tree Example

```
src/views/
├── index.tsx                    # Layout component (excluded from route generation)
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

## Generated Route Structure

Based on the file tree above, the generated route configuration is as follows:

> Two rules:
> 1. **Parameter promotion (spill)**: when a static parent node has its own `page` (component), its "parameter child routes" are **promoted from the parent's `children` to sibling nodes** (e.g. `:id` becomes a sibling of `deep`, and `:optional?` a sibling of `optional`), preventing the parent from being forced to act as a layout; static child routes remain nested as usual.
> 2. **Same-level ordering**: within a level, sort by "static < dynamic < optional < catchAll", then alphabetically within the same category, ensuring more specific routes are matched before broader ones.

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
          // [id] is promoted to a sibling of deep (rather than nested into deep.children)
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
      // [optional$] is promoted to a sibling of optional
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

## Development & Testing

```bash
pnpm test          # Run vitest unit tests (the test/ directory)
pnpm --dir playground install && pnpm --dir playground dev   # Launch the visual Playground (real react-router navigation demo)
```
