import type { FileSystemRoute, FileSystemRouteOptions } from '../src/types'
import { genRoutes } from '../src/index'

/**
 * 测试辅助：用「文件路径列表」喂给真实 genRoutes，拿到生成的路由配置
 * 模拟 Vite import.meta.glob 的返回（{ 文件路径: 惰性加载函数 }）
 */
export function gen(
  paths: string[],
  options: Partial<FileSystemRouteOptions> = {},
): FileSystemRoute[] {
  const modules: Record<string, () => Promise<{ default: any }>> = {}
  for (const p of paths)
    modules[p] = () => Promise.resolve({ default: p })

  return genRoutes({ globComponentsImport: () => modules as any, ...options })
}

/** 深度优先收集所有 path（保留出现顺序，用于断言匹配优先级） */
export function flatPaths(routes: FileSystemRoute[], acc: string[] = []): string[] {
  for (const r of routes) {
    acc.push(r.path)
    if (r.children?.length)
      flatPaths(r.children, acc)
  }
  return acc
}

/** 顶层 path 列表 */
export function topPaths(routes: FileSystemRoute[]): string[] {
  return routes.map(r => r.path)
}

/** 某节点的直接子 path 列表 */
export function childPaths(route: FileSystemRoute | undefined): string[] {
  return (route?.children ?? []).map(r => r.path)
}

/** 按 path 深度优先查找路由 */
export function findByPath(routes: FileSystemRoute[], path: string): FileSystemRoute | undefined {
  for (const r of routes) {
    if (r.path === path)
      return r
    const found = r.children && findByPath(r.children, path)
    if (found)
      return found
  }
  return undefined
}
