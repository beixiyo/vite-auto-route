import { describe, expect, it } from 'vitest'
import { gen, topPaths } from './helpers'

/**
 * #2 catch-all：[...slug] 必须产出消费方能识别的「全路径通配」/**（而非 /:slug/*）
 * 消费方 react-router 把 /** → *splat，捕获完整剩余路径（键名 splat）
 */
describe('catch-all 生成', () => {
  it('[...slug] → path 用 /**', () => {
    const routes = gen(['/src/views/files/[...slug]/page.tsx'])
    expect(routes[0].path).toBe('/files/**')
  })

  it('顶层 [...all] → /**', () => {
    const routes = gen(['/src/views/[...all]/page.tsx'])
    expect(routes[0].path).toBe('/**')
  })

  it('path 与 segments 一致（都用 ** 词元）', () => {
    const routes = gen(['/src/views/files/[...slug]/page.tsx'])
    expect(routes[0].path).toBe('/files/**')
    expect(routes[0].segments).toEqual(['files', '**'])
  })

  it('catch-all 路由名仍来自目录名', () => {
    const routes = gen(['/src/views/files/[...slug]/page.tsx'])
    expect(routes[0].name).toBe('filesSlug')
  })

  it('catchAll 排在静态/动态兄弟之后', () => {
    const routes = gen([
      '/src/views/files/[...slug]/page.tsx',
      '/src/views/files/recent/page.tsx',
    ])
    expect(topPaths(routes)).toEqual(['/files/recent', '/files/**'])
  })
})
