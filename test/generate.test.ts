import { describe, expect, it } from 'vitest'
import { childPaths, findByPath, flatPaths, gen, topPaths } from './helpers'

describe('基础路由生成', () => {
  it('单个静态页面', () => {
    const routes = gen(['/src/views/about/page.tsx'])
    expect(topPaths(routes)).toEqual(['/about'])
    expect(routes[0].name).toBe('about')
    expect(routes[0].rawPath).toBe('about')
    expect(routes[0].segments).toEqual(['about'])
    expect(routes[0].rawSegments).toEqual(['about'])
    expect(typeof routes[0].component).toBe('function')
  })

  it('嵌套静态页面：子路由挂在父 children 下', () => {
    const routes = gen([
      '/src/views/a/page.tsx',
      '/src/views/a/b/page.tsx',
    ])
    expect(topPaths(routes)).toEqual(['/a'])
    expect(childPaths(routes[0])).toEqual(['/a/b'])
  })

  it('动态参数 [id] → :id', () => {
    const routes = gen(['/src/views/post/[id]/page.tsx'])
    expect(routes[0].path).toBe('/post/:id')
    expect(routes[0].segments).toEqual(['post', ':id'])
  })

  it('可选参数 [id$] → :id?', () => {
    const routes = gen(['/src/views/post/[id$]/page.tsx'])
    expect(routes[0].path).toBe('/post/:id?')
  })

  it('多级参数 [a]/[b] → :a/:b', () => {
    const routes = gen(['/src/views/x/[a]/[b]/page.tsx'])
    expect(routes[0].path).toBe('/x/:a/:b')
  })

  it('路由名采用 camelCase 拼接', () => {
    const routes = gen(['/src/views/test/nested/deep/[id]/page.tsx'])
    expect(findByPath(routes, '/test/nested/deep/:id')?.name).toBe('testNestedDeepId')
  })

  it('默认 rawPathKey=_rawPath：同时带 rawPath 与 _rawPath', () => {
    const routes = gen(['/src/views/about/page.tsx'])
    expect(routes[0].rawPath).toBe('about')
    expect((routes[0] as any)._rawPath).toBe('about')
  })

  it('自定义 rawPathKey 生效', () => {
    const routes = gen(['/src/views/about/page.tsx'], { rawPathKey: '__raw' })
    expect((routes[0] as any).__raw).toBe('about')
  })

  it('README 文件树示例：结构与顺序与文档一致', () => {
    const routes = gen([
      '/src/views/test/page.tsx',
      '/src/views/test/nested/page.tsx',
      '/src/views/test/nested/deep/page.tsx',
      '/src/views/test/nested/deep/[id]/page.tsx',
      '/src/views/test/param/[id]/page.tsx',
      '/src/views/test/optional/page.tsx',
      '/src/views/test/optional/[optional$]/page.tsx',
    ])
    expect(flatPaths(routes)).toEqual([
      '/test',
      '/test/nested',
      '/test/nested/deep',
      '/test/nested/deep/:id',
      '/test/optional',
      '/test/optional/:optional?',
      '/test/param/:id',
    ])
  })

  it('空目录树 → 空路由数组', () => {
    expect(gen([])).toEqual([])
  })

  it('忽略非 indexFileName 的文件', () => {
    const routes = gen([
      '/src/views/a/page.tsx',
      '/src/views/a/helper.ts',
      '/src/views/a/Component.tsx',
    ])
    expect(topPaths(routes)).toEqual(['/a'])
  })
})
