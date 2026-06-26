// @vitest-environment jsdom

import type { ComponentType } from 'react'
import type { FileSystemRoute } from '../src/types'
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  useParams,
} from '@jl-org/react-router'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { genRoutes } from '../src/index'

/**
 * jsdom 未实现 Web Animations API；消费方默认 LoadingFallback 在 Suspense 等待期间会
 * 调用 element.animate，这里补一个最小 stub，避免环境缺失干扰真实渲染断言
 */
if (typeof Element !== 'undefined' && typeof Element.prototype.animate !== 'function') {
  Element.prototype.animate = (() => ({ cancel() {}, finish() {} })) as unknown as Element['animate']
}

/**
 * jsdom 集成 / 契约测试
 *
 * 用真实 genRoutes（本包）把「文件路径 → 组件」生成路由，再交给消费方
 * @jl-org/react-router 在 jsdom 里真实渲染，端到端锁定关键修复点：
 * 静态不被动态遮蔽、catch-all 吃完整剩余路径、嵌套布局、可选参数。
 *
 * 与纯函数单测互补：这里验证「生成的路由能被消费方正确匹配并渲染」，
 * 而非仅断言路由配置的形状。
 */

/**
 * 把「文件路径 → 组件」喂给 genRoutes，模拟 Vite import.meta.glob 的惰性加载产物：
 * 每个模块是异步 loader `() => Promise<{ default: Component }>`，触发消费方 Suspense
 */
function genWithComponents(
  modules: Record<string, ComponentType>,
): FileSystemRoute[] {
  const glob: Record<string, () => Promise<{ default: ComponentType }>> = {}
  for (const [filePath, Comp] of Object.entries(modules))
    glob[filePath] = () => Promise.resolve({ default: Comp })

  return genRoutes({ globComponentsImport: () => glob as any })
}

/** 渲染整棵路由树：根 Outlet 承载匹配链 */
async function mount(routes: FileSystemRoute[]) {
  const router = createBrowserRouter({
    routes: routes as any,
    options: { cache: { limit: 20 } },
  })

  await act(async () => {
    render(
      <RouterProvider router={router}>
        <Outlet />
      </RouterProvider>,
    )
  })

  return router
}

/** 导航并等待异步组件解析完成的时机交给 findBy* */
async function nav(router: ReturnType<typeof createBrowserRouter>, path: string) {
  await act(async () => {
    router.navigate(path)
    await Promise.resolve()
  })
}

function setPath(pathname: string) {
  window.history.pushState(null, '', pathname)
}

/**
 * keep-alive 会把离开的「同一路由、不同 cacheKey」实例隐藏（display:none）保活在 DOM 中。
 * 断言当前页面时只取可见（未被隐藏）的那一个，避免命中缓存里的旧实例
 */
function isHidden(el: HTMLElement): boolean {
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    if (node.style?.display === 'none')
      return true
  }
  return false
}

function activeByTestId(testId: string): HTMLElement {
  const visible = screen.queryAllByTestId(testId).filter(el => !isHidden(el))
  expect(visible).toHaveLength(1)
  return visible[0]
}

afterEach(() => {
  cleanup()
})

describe('jsdom 集成：genRoutes 产物在消费方真实渲染', () => {
  it('#1 静态不被动态遮蔽：/posts/new 命中静态、/posts/:id 命中详情', async () => {
    const PostDetail = () => {
      const { params } = useParams()
      return (
        <div data-testid="post-detail">
          详情
          <span data-testid="post-id">{params.id}</span>
        </div>
      )
    }
    const NewPost = () => <div data-testid="new-page">新建文章</div>

    const routes = genWithComponents({
      '/src/views/posts/[id]/page.tsx': PostDetail,
      '/src/views/posts/new/page.tsx': NewPost,
    })

    setPath('/posts/new')
    const router = await mount(routes)

    // 静态段优先：渲染「新建」而非详情
    expect(await screen.findByTestId('new-page')).toBeTruthy()
    expect(screen.queryByTestId('post-detail')).toBeNull()

    await nav(router, '/posts/123')
    expect(await screen.findByTestId('post-detail')).toBeTruthy()
    expect(screen.getByTestId('post-id').textContent).toBe('123')

    router.dispose()
  })

  it('#2 catch-all：/files/a/b/c 命中 [...slug]，splat 含完整剩余路径', async () => {
    const FilesCatchAll = () => {
      const { params } = useParams()
      // splat 为剩余各段组成的数组（path-to-regexp v8 通配符语义），拼回完整剩余路径
      const splat = Array.isArray(params.splat)
        ? params.splat.join('/')
        : params.splat
      return (
        <div data-testid="files-page">
          文件
          <span data-testid="files-splat">{splat}</span>
        </div>
      )
    }

    const routes = genWithComponents({
      '/src/views/files/[...slug]/page.tsx': FilesCatchAll,
    })

    setPath('/files/a/b/c')
    const router = await mount(routes)

    expect(await screen.findByTestId('files-page')).toBeTruthy()
    expect(screen.getByTestId('files-splat').textContent).toBe('a/b/c')

    router.dispose()
  })

  it('嵌套布局：/dashboard/settings 同时渲染布局与子页', async () => {
    const Dashboard = () => (
      <div data-testid="dashboard-layout">
        仪表盘布局
        <Outlet />
      </div>
    )
    const DashboardSettings = () => <div data-testid="settings-page">设置页</div>

    const routes = genWithComponents({
      '/src/views/dashboard/page.tsx': Dashboard,
      '/src/views/dashboard/settings/page.tsx': DashboardSettings,
    })

    setPath('/dashboard/settings')
    const router = await mount(routes)

    // 子页解析完成时，外层布局必然已挂载
    expect(await screen.findByTestId('settings-page')).toBeTruthy()
    expect(screen.getByTestId('dashboard-layout')).toBeTruthy()

    router.dispose()
  })

  it('可选参数：/docs 与 /docs/getting-started 命中同一组件，chapter 为空 / 有值', async () => {
    const Docs = () => {
      const { params } = useParams()
      return (
        <div data-testid="docs-page">
          文档
          <span data-testid="docs-chapter">{params.chapter ?? ''}</span>
        </div>
      )
    }

    const routes = genWithComponents({
      '/src/views/docs/[chapter$]/page.tsx': Docs,
    })

    setPath('/docs')
    const router = await mount(routes)

    // 可选参数缺省：命中组件，chapter 为空
    expect(await screen.findByTestId('docs-page')).toBeTruthy()
    expect(activeByTestId('docs-chapter').textContent).toBe('')

    // 等待新页面（不同 cacheKey）异步解析完成；旧 /docs 实例被 keep-alive 隐藏保活
    await nav(router, '/docs/getting-started')
    await screen.findByText('getting-started')
    expect(activeByTestId('docs-page')).toBeTruthy()
    expect(activeByTestId('docs-chapter').textContent).toBe('getting-started')

    router.dispose()
  })
})
