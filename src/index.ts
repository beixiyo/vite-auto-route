import { toCamel } from './tools'


const PATH_PREFIX = '/src/views'
const RAW_PATH = Symbol('rawPath')

/**
 * '/src/views'下的每个文件夹 必须有`index.vue`
 * `meta`为可选 必须使用默认导出
 * 生成路由配置 { component, meta, path, name }
 */
export function genRoutes() {
    const routeMap = genRouteMap()
    const routeTarget = hanldeNest(routeMap)
    return Object.values(routeTarget) as RouteItem[]
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
            meta = (metaObj[basePath + '/meta.ts'] || metaObj[basePath + '/meta.js'] as any)?.default,

            path = basePath.replace(PATH_PREFIX, '') || '/',
            name = path.slice(1) || 'index'

        routeMap.set(basePath, { component, meta, path, name })
    }
    return routeMap
}

function hanldeNest(routeMap: Map<string, RouteItem>) {
    /** 最终包含 children 的嵌套对象 */
    const parentTarget: any = {},
        /** 临时存放子路由 */
        childTarget: any = {}

    for (const [basePath, route] of routeMap) {
        splitParentAndChild(basePath, route)
    }

    const delPathArr: string[] = []
    appendToParent()
    return parentTarget


    function splitParentAndChild(basePath: string, { component, name, path, meta }: RouteItem) {
        const _path = basePath.replace(PATH_PREFIX, '') || '/'
        /** /path/path2 => ['', 'path', 'path2', ...] */
        const pathChunk = _path.split('/')
        if (pathChunk.length === 2) {
            const parent = pathChunk[1] || '/'
            parentTarget[parent] = { path, name, meta, component, children: [] }
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
                path: pathChunk.at(-1),
                name: _name,
                meta,
                component,
                children: []
            }
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

            /** /path/path2 => ['', 'path', 'path2', ...] */
            const pathChunk = path.split('/')
            if (pathChunk.length === pathLen) {
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
                    delPathArr.push(path)
                }
            }
        }

        /** 完成一遍放入数组 */
        delPathArr.forEach((p) => delete childTarget[p])
        delPathArr.splice(0)
        if (Object.keys(childTarget).length === 0) return

        appendToParent(pathLen + 1)
    }

    function getParent(path: string, oriTarget = parentTarget): any {
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
                target = oriTarget[composePath]
                if (!target) {
                    return null
                }
            }
            else {
                target = findTargetByChildren()
                if (!target) return null
            }
        }

        function findTargetByChildren() {
            const children = target.children

            for (let i = 0; i < children.length; i++) {
                const child = children[i]
                const childTarget = child[RAW_PATH] === composePath && child
                if (childTarget) {
                    return childTarget
                }
            }
            return null
        }

        return target
    }
}


type RouteItem = {
    path: string
    name: string
    component: any
    meta?: Record<string, any>
}
