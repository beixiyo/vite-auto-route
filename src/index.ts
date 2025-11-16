import type {
  FileSystemRoute,
  FileSystemRouteOptions,
  ModuleLoader,
  ParsedSegment,
  RequiredOptions,
  RouteTransformContext,
  RouteTreeNode,
} from './types'

import { buildRoute } from './buildRoute'
import {
  parseSegment,
  sanitizeNameSegment,
  stripLeadingSlash,
  toCamel,
} from './utils'

/**
 * 基于文件系统结构生成路由配置
 */
export function genRoutes(options: FileSystemRouteOptions = {}): FileSystemRoute[] {
  const defaultOptions: RequiredOptions = {
    pathPrefix: /^\/src\/views/,
    rawPathKey: '_rawPath',
    indexFileName: '/page.tsx',
    routerPathFolder: '/src/views',
    globComponentsImport: () => import.meta.glob('/src/views/**/page.tsx'),
    resolveRouteName: ({ rawSegments, isRoot }) => {
      if (isRoot)
        return 'root'
      const name = rawSegments
        .map(segment => sanitizeNameSegment(parseSegment(segment)))
        .filter(Boolean)
        .join('-')
      return toCamel(name || 'page')
    },
  }

  const opts: RequiredOptions = {
    ...defaultOptions,
    ...options,
    globComponentsImport: options.globComponentsImport ?? defaultOptions.globComponentsImport,
    resolveRouteName: options.resolveRouteName ?? defaultOptions.resolveRouteName,
  }

  const componentModules = opts.globComponentsImport()

  const treeRoot: RouteTreeNode = createTreeNode(null, [], null)

  for (const filePath of Object.keys(componentModules)) {
    if (!filePath.endsWith(opts.indexFileName))
      continue

    const loader = componentModules[filePath]
    if (typeof loader !== 'function')
      continue

    const baseDir = filePath.slice(0, filePath.length - opts.indexFileName.length)
    const relativePath = baseDir.replace(opts.pathPrefix, '')
    const normalizedRelative = stripLeadingSlash(relativePath)
    const segments = normalizedRelative.length
      ? normalizedRelative.split('/')
      : []

    insertRoute(treeRoot, segments, loader as ModuleLoader)
  }

  const { route: rootRoute, spilled } = buildRoute(treeRoot, [], [], opts, null)
  const combinedRoutes = []
  if (rootRoute)
    combinedRoutes.push(rootRoute)
  combinedRoutes.push(...spilled)

  const transformed = applyTransform(combinedRoutes, null, opts)
  if (opts.extendRoutes)
    return opts.extendRoutes(transformed)
  return transformed
}

function insertRoute(
  root: RouteTreeNode,
  segments: string[],
  loader: ModuleLoader,
) {
  let current = root
  for (const segment of segments) {
    const existing = current.children.get(segment)
    if (existing) {
      current = existing
      continue
    }

    const child = createTreeNode(segment, [...current.rawSegments, segment], parseSegment(segment))
    current.children.set(segment, child)
    current = child
  }

  current.component = loader
}

function createTreeNode(
  segment: string | null,
  rawSegments: string[],
  parsed: ParsedSegment | null,
): RouteTreeNode {
  return {
    segment,
    parsed,
    rawSegments,
    component: null,
    children: new Map(),
  }
}

function applyTransform(
  routes: FileSystemRoute[],
  parentRoute: FileSystemRoute | null,
  opts: RequiredOptions,
) {
  const nextRoutes: FileSystemRoute[] = []

  for (const route of routes) {
    route.children = applyTransform(route.children, route, opts)

    const context: RouteTransformContext = {
      segments: route.segments,
      rawSegments: route.rawSegments,
      absolutePath: route.path,
      isRoot: route.rawSegments.length === 0,
      route,
      parentRoute,
    }

    // 先应用 customizeRoute（如果存在）
    let customizedRoute = route
    if (opts.customizeRoute) {
      const customizeFn = opts.customizeRoute(context)
      customizedRoute = customizeFn(route)
    }

    // 再应用 transformRoute（如果存在）
    if (!opts.transformRoute) {
      nextRoutes.push(customizedRoute)
      continue
    }

    const transformed = opts.transformRoute(customizedRoute, context)
    if (!transformed)
      continue

    if (Array.isArray(transformed)) {
      nextRoutes.push(...transformed)
    }
    else {
      nextRoutes.push(transformed)
    }
  }

  return nextRoutes
}

export type {
  FileSystemRoute,
  FileSystemRouteOptions,
  ModuleLoader,
} from './types'

export default genRoutes
