import { describe, expect, it } from 'vitest'
import { childPaths, findByPath, gen, topPaths } from './helpers'

/**
 * spill（壳/参数提升）：静态有 page 的父 + 参数子 → 参数路由提升为兄弟；
 * 静态子则正常嵌套在父 children 下
 */
describe('spill 参数提升 / 嵌套规则', () => {
  it('静态父有 page + 参数子 → 参数提升为兄弟', () => {
    const routes = gen([
      '/src/views/user/page.tsx',
      '/src/views/user/[id]/page.tsx',
    ])
    expect(topPaths(routes)).toEqual(['/user', '/user/:id'])
    expect(childPaths(findByPath(routes, '/user'))).toEqual([])
  })

  it('静态父有 page + 静态子 → 静态子嵌套在父下', () => {
    const routes = gen([
      '/src/views/user/page.tsx',
      '/src/views/user/profile/page.tsx',
    ])
    expect(topPaths(routes)).toEqual(['/user'])
    expect(childPaths(findByPath(routes, '/user'))).toEqual(['/user/profile'])
  })

  it('被提升的参数路由保留其自身子树', () => {
    const routes = gen([
      '/src/views/user/page.tsx',
      '/src/views/user/[id]/page.tsx',
      '/src/views/user/[id]/edit/page.tsx',
    ])
    expect(topPaths(routes)).toEqual(['/user', '/user/:id'])
    expect(childPaths(findByPath(routes, '/user/:id'))).toEqual(['/user/:id/edit'])
  })

  it('中间目录无 page：子路由向上冒泡（不产生空壳路由）', () => {
    const routes = gen([
      '/src/views/group/a/page.tsx',
      '/src/views/group/b/page.tsx',
    ])
    // group 自身无 page，不应出现 /group 节点
    expect(topPaths(routes)).toEqual(['/group/a', '/group/b'])
  })

  it('参数父目录无 page，其下子页面被提升', () => {
    const routes = gen([
      '/src/views/shop/page.tsx',
      '/src/views/shop/[id]/detail/page.tsx',
    ])
    expect(topPaths(routes)).toEqual(['/shop', '/shop/:id/detail'])
  })
})
