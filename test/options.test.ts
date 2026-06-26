import { describe, expect, it } from 'vitest'
import { childPaths, findByPath, gen, topPaths } from './helpers'

describe('配置合并与健壮性', () => {
  // #5 显式传 undefined 不应冲掉默认值
  it('显式 indexFileName: undefined 仍正常生成路由', () => {
    const routes = gen(['/src/views/a/page.tsx'], { indexFileName: undefined })
    expect(topPaths(routes)).toEqual(['/a'])
  })

  it('显式 pathPrefix: undefined 仍剥离前缀', () => {
    const routes = gen(['/src/views/a/page.tsx'], { pathPrefix: undefined })
    expect(topPaths(routes)).toEqual(['/a'])
  })

  it('显式 rawPathKey: undefined 不产生字面键 "undefined"', () => {
    const routes = gen(['/src/views/a/page.tsx'], { rawPathKey: undefined })
    expect(Object.keys(routes[0])).not.toContain('undefined')
    expect((routes[0] as any)._rawPath).toBe('a')
  })

  it('自定义 indexFileName / pathPrefix / routerPathFolder', () => {
    const routes = gen(['/pages/home/index.vue'], {
      indexFileName: '/index.vue',
      pathPrefix: /^\/pages/,
      routerPathFolder: '/pages',
    })
    expect(topPaths(routes)).toEqual(['/home'])
  })
})

describe('参数名校验（#6）', () => {
  it('数字开头 [2fa] 构建期抛错', () => {
    expect(() => gen(['/src/views/auth/[2fa]/page.tsx'])).toThrow(/非法路由参数名/)
  })

  it('含空格 [a b] 抛错', () => {
    expect(() => gen(['/src/views/x/[a b]/page.tsx'])).toThrow()
  })

  it('含点号 [a.b] 抛错', () => {
    expect(() => gen(['/src/views/x/[a.b]/page.tsx'])).toThrow()
  })

  it('合法参数名（字母/下划线/$）通过', () => {
    expect(gen(['/src/views/x/[id]/page.tsx'])[0].path).toBe('/x/:id')
    expect(gen(['/src/views/x/[_id]/page.tsx'])[0].path).toBe('/x/:_id')
    expect(gen(['/src/views/x/[$id]/page.tsx'])[0].path).toBe('/x/:$id')
    expect(gen(['/src/views/x/[id2]/page.tsx'])[0].path).toBe('/x/:id2')
  })
})

describe('转换管线 customizeRoute / transformRoute / extendRoutes', () => {
  it('customizeRoute 用 {...route} 展开保留 children', () => {
    const routes = gen([
      '/src/views/a/page.tsx',
      '/src/views/a/b/page.tsx',
    ], {
      customizeRoute: () => route => ({ ...route, meta: { x: 1 } } as any),
    })
    expect((routes[0] as any).meta).toEqual({ x: 1 })
    expect(childPaths(routes[0])).toEqual(['/a/b'])
  })

  it('transformRoute 返回 null 过滤路由', () => {
    const routes = gen([
      '/src/views/keep/page.tsx',
      '/src/views/internal/page.tsx',
    ], {
      transformRoute: route => (route.path.startsWith('/internal') ? null : route),
    })
    expect(topPaths(routes)).toEqual(['/keep'])
  })

  it('transformRoute 返回数组拆分路由', () => {
    const routes = gen(['/src/views/multi/page.tsx'], {
      transformRoute: route => (route.path === '/multi'
        ? [{ ...route, path: '/multi/a' }, { ...route, path: '/multi/b' }]
        : route),
    })
    expect(topPaths(routes)).toEqual(['/multi/a', '/multi/b'])
  })

  it('extendRoutes 追加全局路由', () => {
    const routes = gen(['/src/views/a/page.tsx'], {
      extendRoutes: (rs) => {
        rs.push({ path: '/404', name: 'notFound' } as any)
        return rs
      },
    })
    expect(topPaths(routes)).toEqual(['/a', '/404'])
  })

  it('执行顺序 customizeRoute → transformRoute → extendRoutes', () => {
    const order: string[] = []
    gen(['/src/views/a/page.tsx'], {
      customizeRoute: () => (route) => {
        order.push('customize')
        return route
      },
      transformRoute: (route) => {
        order.push('transform')
        return route
      },
      extendRoutes: (rs) => {
        order.push('extend')
        return rs
      },
    })
    expect(order).toEqual(['customize', 'transform', 'extend'])
  })

  it('自定义 resolveRouteName', () => {
    const routes = gen(['/src/views/a/b/page.tsx'], {
      resolveRouteName: ctx => (ctx.isRoot ? 'root' : ctx.rawSegments.join('.')),
    })
    expect(findByPath(routes, '/a/b')?.name).toBe('a.b')
  })
})
