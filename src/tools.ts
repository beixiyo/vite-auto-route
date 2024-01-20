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
