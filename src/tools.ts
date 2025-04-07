import type { RouteConfigOptions, RouteItem } from '@/types'


/**
 * @returns @example
 * '/src/views/News/' => [{ component, meta, path, name }, ...]
 */
export function genRouteMap(options: Required<RouteConfigOptions>) {
  const {
    paramReg,
    pathPrefix,
    indexFileName,

    globComponentsImport,
    globMetaImport,
  } = options

  const metaObj = globMetaImport()
  const compObj = globComponentsImport()
  const routeMap = new Map<string, RouteItem>()

  for (const key in compObj) {
    if (!Object.hasOwnProperty.call(compObj, key))
      continue

    const basePath = key.replace(indexFileName, '')
    const component = compObj[key]
    const meta = (metaObj[`${basePath}/meta.ts`] || metaObj[`${basePath}/meta.js`] as any)?.default || {}

    const path = basePath.replace(pathPrefix, '') || '/'
    const paramPath = matchPath(path)
    const name = path.slice(1) || indexFileName
      .replace('/', '')
      .split('.')[0]
    /** 名字排除掉通配符 */
    const _name = name.replace(paramReg, '')

    routeMap.set(basePath, { component, meta, path: paramPath, name: _name })
  }

  return routeMap

  function matchPath(path: string) {
    if (path === '/')
      return path

    return path.replace(paramReg, (_all: any, param: string, wildcard: string) => {
      return `/:${param}${wildcard
        ? '?'
        : ''}`
    })
  }
}

export function hanldeNest(
  routeMap: Map<string, RouteItem>,
  options: Required<RouteConfigOptions>,
) {
  const {
    getParamReg,
    pathPrefix,
    rawPath,
    routerPathFolder,
    handleName,
  } = options

  /** 最终包含 children 的嵌套对象 */
  const parentTarget: any = {}
  /** 临时存放子路由 */
  const childTarget: any = {}

  for (const [_basePath, route] of routeMap) {
    splitParentAndChild(route)
  }

  const delPathArr: string[] = []
  appendToParent()
  return parentTarget

  function splitParentAndChild({ component, name, path, meta }: RouteItem) {
    const _path = path.replace(pathPrefix, '') || '/'
    /** /path/path2 => ['', 'path', 'path2', ...] */
    const pathChunk = _path.split('/')
    let len = pathChunk.length

    /** 说明也是根目录 */
    if (len === 3 && pathChunk[2].startsWith(':')) {
      len = 2
    }

    /** 不能用 `delete meta.beforeEnter` 会导致下次调用无法读取 */
    const _meta: any = {}
    const { beforeEnter, redirect } = meta
    for (const k in meta) {
      if (
        !Object.hasOwnProperty.call(meta, k) ||
        ['beforeEnter', 'redirect'].includes(k)
      ) {
        continue
      }

      _meta[k] = meta[k]
    }

    const folderDepth = routerPathFolder.split('/').length - 1
    if (len === folderDepth) {
      const parent = pathChunk[folderDepth - 1] || '/'
      parentTarget[parent] = {
        path,
        name,
        meta: _meta,
        component,
        children: [],
        ...(beforeEnter
          ? { beforeEnter }
          : {}),
        ...(redirect
          ? { redirect }
          : {}),
      }
    }
    else {
      /** 子路由，默认采用驼峰命名法 */
      const _name = handleName(name)
      /** 去除头部的 `/` 作为键 */
      const key = pathChunk.join('/').slice(1)

      childTarget[key] = {
        /** 留着下面方便对比的 */
        [rawPath]: path.slice(1),
        /** 子路由仅需后面作为路径 */
        path: genChildPath(),
        name: _name,
        meta: _meta,
        component,
        children: [],
        ...(beforeEnter
          ? { beforeEnter }
          : {}),
        ...(redirect
          ? { redirect }
          : {}),
      }
    }

    /** 有 param 的，则拼接上去 */
    function genChildPath() {
      let path = ''
      const pathArr: string[] = []
      for (let i = pathChunk.length - 1; i >= 0; i--) {
        const pathItem = pathChunk[i]
        if (pathItem.startsWith(':')) {
          pathArr.unshift(pathItem)
        }
        else {
          path = pathItem
          break
        }
      }

      if (pathArr.length) {
        return `${path}/${pathArr.join('/')}`
      }
      return path
    }
  }

  /**
   * 把子节点 加入父节点
   * @param pathLen 从二级开始查找 逐渐递归查找更深的层级
   */
  function appendToParent(pathLen = 2) {
    for (const path in childTarget) {
      if (!Object.hasOwnProperty.call(childTarget, path))
        continue

      const child = childTarget[path]

      /** /path/path2 => ['', 'path', 'path2'] */
      /** parame 路由其实是同一个节点 所以过滤掉 :param */
      const pathChunk = path.split('/').filter(p => !p.startsWith(':'))
      const pathChunkLen = pathChunk.length
      if (
        pathChunkLen === pathLen
      ) {
        /** 每次都拼接上前面的父亲路径 */
        const parentPathArr = Array.from({ length: pathLen - 1 }).map((_, i) => i)
        const parentPath = parentPathArr.map(i => pathChunk[i]).join('/')
        const parent = getParent(parentPath)

        if (parent) {
          parent.children.push({
            ...child,
            /** 子节点 不需要以 / 开头 */
            path: child.path,
          })
          /** 完成一遍放入数组 后续删除 */
          delPathArr.push(path)
        }
      }
    }

    delPathArr.forEach(p => delete childTarget[p])
    delPathArr.splice(0)
    if (Object.keys(childTarget).length === 0)
      return

    appendToParent(pathLen + 1)
  }

  function getParent(path: string): any {
    const pathArr = path.split('/')

    let target: any
    let composePath = ''
    for (let i = 0; i < pathArr.length; i++) {
      if (i === 0) {
        composePath += pathArr[i]
      }
      else {
        composePath += `/${pathArr[i]}`
      }

      /** 第一层 直接找 */
      if (i === 0) {
        target = parentTarget[composePath]
        if (!target) {
          return null
        }
      }
      else {
        target = findTargetByChildren()
        if (!target)
          return null
      }
    }
    return target

    function findTargetByChildren() {
      const children = target.children

      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        const _rawPath = child[rawPath].replace(getParamReg, '')
        if (composePath === _rawPath) {
          return child
        }
      }
      return null
    }
  }
}


/**
 * 蛇形转驼峰 也可以指定转换其他的
 * @param key 需要转换的字符串
 * @param replaceStr 默认是 `_`，也就是蛇形转驼峰
 * @example
 * toCamel('test_a') => 'testA'
 * toCamel('test/a', '/') => 'testA'
 */
export function toCamel(key: string, replaceStr = '_') {
  const reg = new RegExp(`${replaceStr}([a-z])`, 'ig')

  return key.replace(reg, (_, g1) => {
    return g1.toUpperCase()
  })
}
