export type ModuleLoader = () => Promise<unknown>

/**
 * 表示通过文件系统扫描生成的单个路由节点
 */
export interface FileSystemRoute {
  path: string
  name: string
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
  globComponentsImport?: () => Record<string, ModuleLoader>
  /**
   * 自定义路由名称生成策略
   */
  resolveRouteName?: (context: ResolveRouteNameContext) => string
  /**
   * 针对单个路由节点进行转换，可用于新增、过滤或修改节点
   */
  transformRoute?: (
    route: FileSystemRoute,
    context: RouteTransformContext,
  ) => FileSystemRoute | FileSystemRoute[] | null
  /**
   * 在全部路由生成完成后进行统一处理
   */
  extendRoutes?: (routes: FileSystemRoute[]) => FileSystemRoute[]
}

export type RequiredOptions = Required<
  Pick<
    FileSystemRouteOptions,
    'pathPrefix' | 'rawPathKey' | 'indexFileName' | 'routerPathFolder'
  >
> & {
  globComponentsImport: () => any
  resolveRouteName: (context: ResolveRouteNameContext) => string
  transformRoute?: FileSystemRouteOptions['transformRoute']
  extendRoutes?: FileSystemRouteOptions['extendRoutes']
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
