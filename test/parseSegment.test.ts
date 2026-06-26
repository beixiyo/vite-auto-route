import { describe, expect, it } from 'vitest'
import { joinAsAbsolutePath, parseSegment, toCamel } from '../src/utils'

describe('parseSegment', () => {
  it('静态段', () => {
    expect(parseSegment('about')).toMatchObject({ type: 'static', pathPart: 'about', paramName: 'about' })
  })

  it('动态 [id]', () => {
    expect(parseSegment('[id]')).toMatchObject({ type: 'dynamic', pathPart: ':id', paramName: 'id' })
  })

  it('可选 [id$]', () => {
    expect(parseSegment('[id$]')).toMatchObject({ type: 'optional', pathPart: ':id?', paramName: 'id' })
  })

  it('catchAll [...slug] → pathPart **', () => {
    expect(parseSegment('[...slug]')).toMatchObject({ type: 'catchAll', pathPart: '**', paramName: 'slug' })
  })

  it('catchAll 空名 [...] → 退回 slug', () => {
    expect(parseSegment('[...]')).toMatchObject({ type: 'catchAll', pathPart: '**', paramName: 'slug' })
  })

  it('非法参数名抛错', () => {
    expect(() => parseSegment('[2fa]')).toThrow(/非法路由参数名/)
    expect(() => parseSegment('[a b]')).toThrow()
    expect(() => parseSegment('[a.b]')).toThrow()
    expect(() => parseSegment('[]')).toThrow()
    expect(() => parseSegment('[$]')).toThrow() // 去掉 $ 后为空名
  })

  it('合法标识符参数名', () => {
    expect(parseSegment('[_x]').pathPart).toBe(':_x')
    expect(parseSegment('[$x]').pathPart).toBe(':$x')
    expect(parseSegment('[x9]').pathPart).toBe(':x9')
  })
})

describe('joinAsAbsolutePath', () => {
  it('空数组 → /', () => {
    expect(joinAsAbsolutePath([])).toBe('/')
  })

  it('普通拼接', () => {
    expect(joinAsAbsolutePath(['a', ':id'])).toBe('/a/:id')
  })

  it('catch-all ** 原样保留', () => {
    expect(joinAsAbsolutePath(['files', '**'])).toBe('/files/**')
  })

  it('过滤空段', () => {
    expect(joinAsAbsolutePath(['a', '', 'b'])).toBe('/a/b')
  })
})

describe('toCamel', () => {
  it('分隔符后字母大写', () => {
    expect(toCamel('test-nested-deep')).toBe('testNestedDeep')
    expect(toCamel('a_b_c')).toBe('aBC')
  })
})
