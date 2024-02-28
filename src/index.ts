import { toCamel } from './tools'


const PATH_PREFIX = /^\/src\/views/,
    RAW_PATH = Symbol('rawPath'),
    /** 把路由参数替换的正则: /path/[param$] => /path/:param? */
    REG_PARAM = /\[(\w+)(\$)?\]/g,
    /** 匹配 param 的正则 */
    REG_GET_PARAM = /\/:\w+\??/g

/**
 * '/src/views' 下的每个文件夹 必须有`index.vue`
 *
 * param 参数，使用`[]`包裹： `/about[param]`
 *
 * 可选 param，使用 `$` 结尾： `about/[param$]`
 *
 * `meta` 为可选 必须使用默认导出
 *
 * `meta` 里的 *beforeEnter* | *redirect* 会被提取出来
 *
 * 生成路由配置
 * @returns @example
 * { component, meta, path, name, beforeEnter, redirect }
 */
function genRoutes() {
    const routeMap = genRouteMap()
    const routeTarget = hanldeNest(routeMap)
    return Object.values(routeTarget) as RouteItem[]
}

export default genRoutes
export {
    genRoutes
}


/**
 * @returns @example
 * '/src/views/News/' => [{ component, meta, path, name }, ...]
 */
function genRouteMap() {
    /** 获取`meta` 的数据 作为`meta` 无法使用动态字符串 */
    const metaObj = import.meta.glob('/src/views/**/meta.(js|ts)', {
        eager: true, // 获取导出对象
        // import: 'default' // 直接获取默认导出
    })

    /** 获取组件 */
    const compObj = import.meta.glob('/src/views/**/index.vue')
    const routeMap = new Map<string, RouteItem>()

    for (const key in compObj) {
        if (!Object.hasOwnProperty.call(compObj, key)) continue

        const basePath = key.replace('/index.vue', ''),
            component = compObj[key],
            meta = (metaObj[basePath + '/meta.ts'] || metaObj[basePath + '/meta.js'] as any)?.default || {},

            path = basePath.replace(PATH_PREFIX, '') || '/',
            paramPath = matchPath(path),
            name = path.slice(1) || 'index',
            /** 名字排除掉通配符 */
            _name = name.replace(REG_PARAM, '')

        routeMap.set(basePath, { component, meta, path: paramPath, name: _name })
    }
    return routeMap
}

function matchPath(path: string) {
    if (path === '/') return path

    return path.replace(REG_PARAM, (_all: any, param: string, wildcard: string) => {
        return `/:${param}${wildcard ? '?' : ''}`
    })
}

function hanldeNest(routeMap: Map<string, RouteItem>) {
    /** 最终包含 children 的嵌套对象 */
    const parentTarget: any = {},
        /** 临时存放子路由 */
        childTarget: any = {}

    for (const [_basePath, route] of routeMap) {
        splitParentAndChild(route)
    }

    const delPathArr: string[] = []
    appendToParent()
    return parentTarget


    function splitParentAndChild({ component, name, path, meta }: RouteItem) {
        const _path = path.replace(PATH_PREFIX, '') || '/'
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
            ) continue

            _meta[k] = meta[k]
        }

        if (len === 2) {
            const parent = pathChunk[1] || '/'
            parentTarget[parent] = {
                path,
                name,
                meta: _meta,
                component,
                children: [],
                ...(beforeEnter ? { beforeEnter } : {}),
                ...(redirect ? { redirect } : {}),
            }
        }
        else {
            /** 子路由 采用驼峰命名法 */
            const _name = toCamel(name, '/')
            /** 去除头部的 `/` 作为键 */
            const key = pathChunk.join('/').slice(1)

            childTarget[key] = {
                /** 留着下面方便对比的 */
                [RAW_PATH]: path.slice(1),
                /** 子路由仅需后面作为路径 */
                path: genChildPath(),
                name: _name,
                meta: _meta,
                component,
                children: [],
                ...(beforeEnter ? { beforeEnter } : {}),
                ...(redirect ? { redirect } : {}),
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
                return path + '/' + pathArr.join('/')
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
            if (!Object.hasOwnProperty.call(childTarget, path)) continue

            const child = childTarget[path]

            /** /path/path2 => ['', 'path', 'path2'] */
            /** parame 路由其实是同一个节点 所以过滤掉 :param */
            const pathChunk = path.split('/').filter((p) => !p.startsWith(':')),
                pathChunkLen = pathChunk.length
            if (
                pathChunkLen === pathLen
            ) {
                /** 每次都拼接上前面的父亲路径 */
                const parentPathArr = Array.from({ length: pathLen - 1 }).map((_, i) => i),
                    parentPath = parentPathArr.map((i) => pathChunk[i]).join('/'),
                    parent = getParent(parentPath)

                if (parent) {
                    parent.children.push({
                        ...child,
                        /** 子节点 不需要以 / 开头 */
                        path: child.path
                    })
                    /** 完成一遍放入数组 后续删除 */
                    delPathArr.push(path)
                }
            }
        }

        delPathArr.forEach((p) => delete childTarget[p])
        delPathArr.splice(0)
        if (Object.keys(childTarget).length === 0) return

        appendToParent(pathLen + 1)
    }

    function getParent(path: string): any {
        const pathArr = path.split('/')

        let target: any,
            composePath = ''
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
                if (!target) return null
            }
        }
        return target


        function findTargetByChildren() {
            const children = target.children

            for (let i = 0; i < children.length; i++) {
                const child = children[i]
                const rawPath = child[RAW_PATH].replace(REG_GET_PARAM, '')
                if (composePath === rawPath) {
                    return child
                }
            }
            return null
        }
    }
}


type RouteItem = {
    path: string
    name: string
    component: any
    meta: Record<string, any>
    redirect?: string
}
