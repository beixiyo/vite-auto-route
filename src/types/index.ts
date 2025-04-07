export interface RouteItem {
  path: string
  name: string
  component: any
  meta: Record<string, any>
}

export interface RouteConfigOptions {
  /**
   * 路径前缀正则
   * @default /^\/src\/views/
   */
  pathPrefix?: RegExp

  /**
   * 原始路径的标识
   * @default _rawPath
   */
  rawPath?: string

  /**
   * 参数匹配正则
   * @default /\[(\w+)(\$)?\]/g
   */
  paramReg?: RegExp

  /**
   * 获取参数的正则
   * @default /\/:\w+\??/g
   */
  getParamReg?: RegExp

  /**
   * 主文件名，必须和 globComponentsImport 匹配，某则报错
   * @default '/index.vue'
   */
  indexFileName?: string

  /**
   * 路由目录
   * @default '/src/views'
   */
  routerPathFolder?: string

  /**
   * 文件导入函数，返回 Vite 的 import.meta.glob 结果
   * 因为 import.meta.glob 是 Vite 的构建时功能，不能接受动态参数
   * 需要通过函数返回静态调用结果
   * @example
   * () => import.meta.glob('/src/views/** /index.vue')
   */
  globComponentsImport?: () => Record<string, any>

  /**
   * meta 文件导入函数，返回 Vite 的 import.meta.glob 结果
   * 因为 import.meta.glob 是 Vite 的构建时功能，不能接受动态参数
   * 需要通过函数返回静态调用结果
   * @example
   * () => import.meta.glob('/src/views/** /meta.(js|ts)', { eager: true })
   */
  globMetaImport?: () => Record<string, any>

  /**
   * 处理名字，默认转换为驼峰式
   */
  handleName?: (path: string) => string
}
