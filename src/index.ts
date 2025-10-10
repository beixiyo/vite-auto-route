import type { RouteConfigOptions, RouteItem } from './types'
import { toCamel } from './tools'
import { genRouteMap, hanldeNest } from './tools'


/**
 * ## 如果遇到数组没有匹配到路由，请先删除 `/node_modules/.vite` 文件夹，再重新编译
 *
 * - '/src/views' 下的每个文件夹 必须有`index.vue`
 * - param 参数，使用`[]`包裹： `/about[param]`
 * - 可选 param，使用 `$` 结尾： `about/[param$]`
 * - `meta` 为可选 必须使用默认导出
 * - `meta` 里的 *beforeEnter* | *redirect* 会被提取出来
 *
 * 生成路由配置
 * @returns @example
 * { component, meta, path, name, beforeEnter, redirect }
 */
function genRoutes(options: RouteConfigOptions = {}) {
  const defaultOptions: Required<RouteConfigOptions> = {
    pathPrefix: /^\/src\/views/,
    rawPath: '_rawPath',
    paramReg: /\[(\w+)(\$)?\]/g,
    getParamReg: /\/:\w+\??/g,
    indexFileName: '/index.vue',
    routerPathFolder: '/src/views',

    globMetaImport: () => import.meta.glob('/src/views/**/meta.(js|ts)', { eager: true }),
    globComponentsImport: () => import.meta.glob('/src/views/**/index.vue'),
    handleName: path => toCamel(path, '/'),
  }

  const opts = {
    ...defaultOptions,
    ...options,
  }

  const routeMap = genRouteMap(opts)
  const routeTarget = hanldeNest(routeMap, opts)
  return Object.values(routeTarget) as RouteItem[]
}

export default genRoutes
export {
  genRoutes,
}