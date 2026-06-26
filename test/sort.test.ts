import { describe, expect, it } from 'vitest'
import { gen, topPaths } from './helpers'

/**
 * #1 同级排序：静态 < 动态 < 可选 < catchAll
 * 消费方按数组顺序首个命中，故静态兄弟必须排在动态前面，否则被永久遮蔽
 */
describe('同级排序：静态优先于动态/catchAll', () => {
  it('静态 settings 与 动态 [id] 同级（父无 page）：静态在前', () => {
    const routes = gen([
      '/src/views/group/settings/page.tsx',
      '/src/views/group/[id]/page.tsx',
    ])
    expect(topPaths(routes)).toEqual(['/group/settings', '/group/:id'])
  })

  it('真实场景 posts/[id] + posts/new：/posts/new 不被 :id 遮蔽', () => {
    const routes = gen([
      '/src/views/posts/[id]/page.tsx',
      '/src/views/posts/new/page.tsx',
    ])
    // 静态 /posts/new 必须排在 /posts/:id 之前
    expect(topPaths(routes)).toEqual(['/posts/new', '/posts/:id'])
    expect(topPaths(routes).indexOf('/posts/new'))
      .toBeLessThan(topPaths(routes).indexOf('/posts/:id'))
  })

  it('多个静态 + 一个动态：所有静态都排在动态前', () => {
    const routes = gen([
      '/src/views/a/[id]/page.tsx',
      '/src/views/a/new/page.tsx',
      '/src/views/a/x/page.tsx',
      '/src/views/a/y/page.tsx',
    ])
    expect(topPaths(routes)).toEqual(['/a/new', '/a/x', '/a/y', '/a/:id'])
  })

  it('静态 < 动态 < catchAll 三档顺序', () => {
    const routes = gen([
      '/src/views/r/[...rest]/page.tsx',
      '/src/views/r/[id]/page.tsx',
      '/src/views/r/static/page.tsx',
    ])
    expect(topPaths(routes)).toEqual(['/r/static', '/r/:id', '/r/**'])
  })

  it('排序对嵌套层同样生效（父有 page 时的 children）', () => {
    const routes = gen([
      '/src/views/g/page.tsx',
      '/src/views/g/zebra/page.tsx',
      '/src/views/g/alpha/page.tsx',
    ])
    // 同为静态，按字母序
    expect(routes[0].children?.map(r => r.path)).toEqual(['/g/alpha', '/g/zebra'])
  })
})
