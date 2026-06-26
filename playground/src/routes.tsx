import { createBrowserRouter } from '@jl-org/react-router'
import { genRoutes } from '@jl-org/vite-auto-route'
import { Home } from './pages/Home'

/**
 * 自动生成路由配置。
 * 注意：react-router 的 route.component 直接接受 import.meta.glob 返回的 loader
 * （() => Promise<{ default }>），无需 lazy / customizeRoute 转换。
 */
export const generated = genRoutes({
  globComponentsImport: () => import.meta.glob('/src/views/**/page.tsx'),
  // 用 extendRoutes 注入首页（views 根目录不放 page.tsx，避免根被当作全局布局）
  extendRoutes: (routes) => {
    routes.unshift({ path: '/', name: 'home', component: Home, children: [] } as any)
    return routes
  },
})

export const router = createBrowserRouter({
  routes: generated as any,
  options: { cache: { limit: 20 } },
})
