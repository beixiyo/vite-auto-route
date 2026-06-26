import { describe, expect, it } from 'vitest'
import { childPaths, findByPath, gen, topPaths } from './helpers'

/**
 * #4 root 对称性：根 page.tsx 应与非根静态父行为一致
 * —— 顶层参数路由提升为兄弟，而非被嵌进 `/` 逼根组件当布局
 */
describe('root 节点对称性', () => {
  it('root page + 顶层 [id] → 兄弟（而非嵌套）', () => {
    const routes = gen([
      '/src/views/page.tsx',
      '/src/views/[id]/page.tsx',
    ])
    expect(topPaths(routes)).toEqual(['/', '/:id'])
    expect(childPaths(findByPath(routes, '/'))).toEqual([])
  })

  it('与非根行为对称（user/page + user/[id] 也是兄弟）', () => {
    const root = gen([
      '/src/views/page.tsx',
      '/src/views/[id]/page.tsx',
    ])
    const nested = gen([
      '/src/views/user/page.tsx',
      '/src/views/user/[id]/page.tsx',
    ])
    expect(topPaths(root)).toEqual(['/', '/:id'])
    expect(topPaths(nested)).toEqual(['/user', '/user/:id'])
  })

  it('root page + 顶层静态子 → 静态子仍嵌套在 / 下', () => {
    const routes = gen([
      '/src/views/page.tsx',
      '/src/views/about/page.tsx',
    ])
    expect(topPaths(routes)).toEqual(['/'])
    expect(childPaths(findByPath(routes, '/'))).toEqual(['/about'])
  })

  it('仅 root page', () => {
    const routes = gen(['/src/views/page.tsx'])
    expect(topPaths(routes)).toEqual(['/'])
    expect(routes[0].name).toBe('root')
    expect(routes[0].rawPath).toBe('/')
  })

  it('无 root page + 顶层 [id]', () => {
    const routes = gen(['/src/views/[id]/page.tsx'])
    expect(topPaths(routes)).toEqual(['/:id'])
  })
})
