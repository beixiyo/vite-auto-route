import type { FileSystemRoute, ModuleLoader, RequiredOptions, RouteTreeNode } from './types'
import { joinAsAbsolutePath } from './utils'

export
function buildRoute(
  node: RouteTreeNode,
  normalizedSegments: string[],
  rawSegments: string[],
  opts: RequiredOptions,
): BuildResult {
  const currentNormalized = node.parsed?.pathPart
    ? [...normalizedSegments, node.parsed.pathPart]
    : [...normalizedSegments]
  const currentRaw = node.segment
    ? [...rawSegments, node.segment]
    : [...rawSegments]

  const directChildren: FileSystemRoute[] = []
  const spilledChildren: FileSystemRoute[] = []

  /**
   * 同级排序：静态 < 动态 < 可选 < catchAll，同类再按字母序
   * 让更「具体」的路由永远排在更「宽泛」的前面 —— 消费方按数组顺序首个命中，
   * 否则 `/group/:id` 排在 `/group/settings` 前会把静态路由永久遮蔽
   */
  const children = Array.from(node.children.values()).sort((a, b) => {
    const ra = segmentRank(a)
    const rb = segmentRank(b)
    if (ra !== rb)
      return ra - rb
    return (a.segment ?? '').localeCompare(b.segment ?? '')
  })

  /** 当前节点是否为「静态且有 component」的父（根节点 parsed=null 视作静态根 `/`，与非根静态父一致） */
  const isParentStaticWithComponent = isStaticWithComponent(node)

  for (const child of children) {
    const childResult = buildRoute(child, currentNormalized, currentRaw, opts)

    const isChildParamRoute = child.parsed != null && child.parsed.type !== 'static'
    /**
     * 静态有组件父 + 参数子 → 把参数路由「提升」为兄弟节点，而非嵌进父 children：
     * 否则父级会被迫从「内容页」降格为「必须套 Outlet 的布局」
     */
    const promoteToSibling = isParentStaticWithComponent && isChildParamRoute

    if (childResult.route) {
      if (promoteToSibling)
        spilledChildren.push(childResult.route)
      else if (node.component)
        directChildren.push(childResult.route)
      else
        spilledChildren.push(childResult.route)
    }

    if (childResult.spilled.length) {
      if (promoteToSibling)
        spilledChildren.push(...childResult.spilled)
      else if (node.component)
        directChildren.push(...childResult.spilled)
      else
        spilledChildren.push(...childResult.spilled)
    }
  }

  /** 无 component 的中间节点：自身不成路由，子路由全部向上冒泡（directChildren 此时恒为空） */
  if (!node.component) {
    return {
      route: null,
      spilled: spilledChildren,
    }
  }

  const route = createRouteFromNode(node, currentNormalized, currentRaw, directChildren, opts)
  return {
    route,
    spilled: spilledChildren,
  }
}

/** 「静态且有 component」判定；根节点 parsed=null 视作静态根 `/` */
function isStaticWithComponent(node: RouteTreeNode): boolean {
  return Boolean(node.component) && (!node.parsed || node.parsed.type === 'static')
}

/** 段类型排序权重：静态(0) < 动态(1) < 可选(2) < catchAll(3) */
function segmentRank(node: RouteTreeNode): number {
  switch (node.parsed?.type) {
    case 'catchAll':
      return 3
    case 'optional':
      return 2
    case 'dynamic':
      return 1
    default:
      return 0
  }
}

function createRouteFromNode(
  node: RouteTreeNode,
  normalizedSegments: string[],
  rawSegments: string[],
  children: FileSystemRoute[],
  opts: RequiredOptions,
): FileSystemRoute {
  const absolutePath = joinAsAbsolutePath(normalizedSegments)
  const rawPath = joinAsAbsolutePath(rawSegments).slice(1) || '/'

  const isRoot = rawSegments.length === 0
  const name = opts.resolveRouteName({
    segments: normalizedSegments,
    rawSegments,
    absolutePath,
    isRoot,
  })

  const route: FileSystemRoute = {
    path: absolutePath,
    name,
    component: node.component as ModuleLoader,
    children,
    rawPath,
    segments: [...normalizedSegments],
    rawSegments: [...rawSegments],
  }

  if (opts.rawPathKey !== 'rawPath')
    (route as any)[opts.rawPathKey] = rawPath

  return route
}

interface BuildResult {
  route: FileSystemRoute | null
  spilled: FileSystemRoute[]
}
