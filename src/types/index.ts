import type { ImportGlobFunction } from 'vite'

/**
 * 模块加载器类型
 * 函数形式支持真正的延迟加载（lazy loading）
 *
 * 设计理由：
 * 1. 与 Vite 的 import.meta.glob() 返回类型一致，无需转换
 * 2. 函数调用时才执行，实现真正的按需加载
 * 3. 支持条件加载、错误处理等高级场景
 * 4. 避免 Promise 创建时立即开始加载的问题
 *
 * 使用示例：
 * ```ts
 * const loader: ModuleLoader = () => import('./views/Home')
 * // 只有在调用 loader() 时才会开始加载模块
 * ```
 */
export type ModuleLoader = () => Promise<{ default: any }>

/**
 * 表示通过文件系统扫描生成的单个路由节点
 */
export interface FileSystemRoute {
  path: string
  name: string
  /**
   * 组件加载器（函数形式）
   *
   * 使用函数而非 Promise 的原因：
   * - 函数调用时才执行，实现真正的延迟加载
   * - 与 Vite import.meta.glob() 返回类型一致
   * - 支持条件加载和错误处理
   */
  component: ModuleLoader
  children: FileSystemRoute[]
  rawPath: string
  /**
   * 归一化后的路径片段，例如 ['cards', ':id?']
   */
  segments: string[]
  /**
   * 原始路径片段，例如 ['cards', '[id$]']
   */
  rawSegments: string[]
  [key: string]: any
}

/**
 * 生成路由名称时的上下文信息
 */
export interface ResolveRouteNameContext {
  /**
   * 归一化后的路径片段，例如 ['cards', ':id?']
   */
  segments: string[]
  /**
   * 原始路径片段，例如 ['cards', '[id$]']
   */
  rawSegments: string[]
  /**
   * 当前节点对应的绝对路径，永远以 `/` 开头
   */
  absolutePath: string
  /**
   * 是否为根节点
   */
  isRoot: boolean
}

/**
 * 自定义路由转换时的上下文
 */
export interface RouteTransformContext extends ResolveRouteNameContext {
  /**
   * 当前待转换的路由对象
   */
  route: FileSystemRoute
  /**
   * 父级路由对象，根节点时为 null
   */
  parentRoute: FileSystemRoute | null
}

/**
 * 文件系统路由生成器的配置项
 */
export interface FileSystemRouteOptions {
  /**
   * 路径前缀正则，用于从完整路径中剥离扫描目录
   * @default /^\/src\/views/
   */
  pathPrefix?: RegExp
  /**
   * 原始路径在路由对象上的字段名
   * @default _rawPath
   */
  rawPathKey?: string
  /**
   * 主文件名，必须与 globComponentsImport 一致
   * @default '/page.tsx'
   */
  indexFileName?: string
  /**
   * 路由扫描目录
   * @default '/src/views'
   */
  routerPathFolder?: string
  /**
   * 组件文件导入函数，返回 Vite import.meta.glob 的结果
   */
  globComponentsImport?: () => ReturnType<ImportGlobFunction>
  /**
   * 自定义路由名称生成策略
   */
  resolveRouteName?: (context: ResolveRouteNameContext) => string
  /**
   * 自定义路由项的回调函数（推荐用于简单字段修改）
   *
   * **执行顺序：最早**，在 `transformRoute` 之前执行
   *
   * **适用场景：**
   * - 添加或修改路由字段（如 `middlewares`、`meta`）
   * - 基于路径、名称等简单条件进行字段设置
   * - 不需要过滤或拆分路由的场景
   *
   * **特点：**
   * - 只能修改单个路由，不能过滤或拆分
   * - 返回类型固定为 `FileSystemRoute`
   * - API 设计更简洁，适合简单场景
   *
   * @example
   * ```ts
   * customizeRoute: (context) => {
   *   return (route) => {
   *     // 根据路径添加 middleware
   *     if (route.path === '/admin') {
   *       route.middlewares = [requireLogin, requireAdmin]
   *     }
   *     // 添加 meta 信息
   *     if (route.path === '/dashboard') {
   *       route.meta = { title: 'Dashboard', requiresAuth: true }
   *     }
   *     return route
   *   }
   * }
   * ```
   */
  customizeRoute?: (
    context: RouteTransformContext
  ) => (route: FileSystemRoute) => any
  /**
   * 针对单个路由节点进行转换（推荐用于复杂转换逻辑）
   *
   * **执行顺序：中间**，在 `customizeRoute` 之后执行
   *
   * **适用场景：**
   * - 需要过滤掉某些路由（返回 `null`）
   * - 需要将一个路由拆分成多个路由（返回数组）
   * - 需要复杂的转换逻辑
   * - 需要基于路由结构进行深度修改
   *
   * **特点：**
   * - 可以返回 `null` 来过滤路由
   * - 可以返回数组来拆分路由
   * - 功能更强大，适合复杂场景
   *
   * @example
   * ```ts
   * transformRoute: (route, context) => {
   *   // 过滤掉某些路由
   *   if (route.path.startsWith('/internal')) {
   *     return null
   *   }
   *   // 将一个路由拆分成多个
   *   if (route.path === '/multi') {
   *     return [
   *       { ...route, path: '/multi/a' },
   *       { ...route, path: '/multi/b' }
   *     ]
   *   }
   *   return route
   * }
   * ```
   */
  transformRoute?: (
    route: FileSystemRoute,
    context: RouteTransformContext,
  ) => FileSystemRoute | FileSystemRoute[] | null
  /**
   * 在全部路由生成完成后进行统一处理（推荐用于全局操作）
   *
   * **执行顺序：最后**，在所有路由转换完成后执行
   *
   * **适用场景：**
   * - 添加全局路由（如 404 页面、错误页面）
   * - 对路由数组进行排序
   * - 全局级别的路由处理
   * - 需要访问完整路由树的场景
   *
   * **特点：**
   * - 接收整个路由数组，可以添加、删除、重新排序
   * - 在单个路由转换完成后执行
   * - 适合全局级别的操作
   *
   * @example
   * ```ts
   * extendRoutes: (routes) => {
   *   // 添加 404 路由
   *   routes.push({
   *     path: '*',
   *     name: 'notFound',
   *     component: () => import('./views/404'),
   *     // ...
   *   })
   *   // 对路由进行排序
   *   return routes.sort((a, b) => a.path.localeCompare(b.path))
   * }
   * ```
   */
  extendRoutes?: (routes: FileSystemRoute[]) => any[]
}

export type RequiredOptions = Required<
  Pick<
    FileSystemRouteOptions,
    'pathPrefix' | 'rawPathKey' | 'indexFileName' | 'routerPathFolder'
  >
> & {
  globComponentsImport: () => ReturnType<ImportGlobFunction>
  resolveRouteName: (context: ResolveRouteNameContext) => string
  transformRoute?: FileSystemRouteOptions['transformRoute']
  extendRoutes?: FileSystemRouteOptions['extendRoutes']
  customizeRoute?: FileSystemRouteOptions['customizeRoute']
}

export interface RouteTreeNode {
  segment: string | null
  parsed: ParsedSegment | null
  rawSegments: string[]
  component: ModuleLoader | null
  children: Map<string, RouteTreeNode>
}

export type SegmentType = 'static' | 'dynamic' | 'optional' | 'catchAll'

export interface ParsedSegment {
  raw: string
  paramName: string
  pathPart: string | null
  type: SegmentType
}
