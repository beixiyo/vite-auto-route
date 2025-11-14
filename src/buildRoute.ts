import type { FileSystemRoute, ModuleLoader, RequiredOptions, RouteTreeNode } from './types'
import { joinAsAbsolutePath } from './utils'

export
function buildRoute(
  node: RouteTreeNode,
  normalizedSegments: string[],
  rawSegments: string[],
  opts: RequiredOptions,
  lastStaticParent: RouteTreeNode | null = null, // 新增：追踪最近的静态父节点
): BuildResult {
  const currentNormalized = node.parsed?.pathPart
    ? [...normalizedSegments, node.parsed.pathPart]
    : [...normalizedSegments]
  const currentRaw = node.segment
    ? [...rawSegments, node.segment]
    : [...rawSegments]

  /** 如果当前节点是静态的且有 component，它就是新的静态父节点 */
  const isStaticWithComponent = node.component && node.parsed?.type === 'static'
  const currentStaticParent = isStaticWithComponent
    ? node
    : lastStaticParent

  const directChildren: FileSystemRoute[] = []
  const spilledChildren: FileSystemRoute[] = []

  const children = Array.from(node.children.values()).sort((a, b) => {
    const left = a.segment ?? ''
    const right = b.segment ?? ''
    return left.localeCompare(right)
  })

  for (const child of children) {
    const childResult = buildRoute(child, currentNormalized, currentRaw, opts, currentStaticParent)

    if (childResult.route) {
      if (child.parsed && child.parsed.type !== 'static') {
        /**
         * 参数路由：如果存在静态父节点，放入 spilled 让静态父节点处理
         * 否则继续向上传播
         */
        if (currentStaticParent) {
          spilledChildren.push(childResult.route)
        }
        else {
          spilledChildren.push(childResult.route)
        }
      }
      else {
        directChildren.push(childResult.route)
      }
    }

    if (childResult.spilled.length) {
      /** 如果当前节点是静态的且有 component，参数子路由应该放在它的 children 中 */
      if (isStaticWithComponent) {
        directChildren.push(...childResult.spilled)
      }
      else {
        spilledChildren.push(...childResult.spilled)
      }
    }
  }

  if (!node.component) {
    return {
      route: null,
      spilled: [...directChildren, ...spilledChildren],
    }
  }

  const route = createRouteFromNode(node, currentNormalized, currentRaw, directChildren, opts)
  return {
    route,
    spilled: spilledChildren,
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
