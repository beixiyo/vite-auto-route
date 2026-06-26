import type { ParsedSegment } from './types'

export function stripLeadingSlash(value: string) {
  if (!value.length)
    return value
  if (value === '/')
    return ''
  return value.startsWith('/')
    ? value.slice(1)
    : value
}

export function joinAsAbsolutePath(segments: string[]) {
  const joined = segments.filter(Boolean).join('/')
  return joined.length
    ? `/${joined}`
    : '/'
}

export function toCamel(input: string) {
  return input.replace(/[-_/](\w)/g, (_match, group: string) => group.toUpperCase())
}

export function sanitizeNameSegment(raw: ParsedSegment) {
  if (!raw.raw.length)
    return ''
  if (raw.type === 'static')
    return raw.raw
  return raw.paramName
}

/** 合法路由参数名：字母/下划线/$ 开头，其余为单词字符或 $（与 path-to-regexp v8 要求一致） */
const VALID_PARAM_NAME = /^[A-Z_$][\w$]*$/i

export function parseSegment(segment: string): ParsedSegment {
  if (!segment.length) {
    return {
      raw: '',
      paramName: '',
      pathPart: '',
      type: 'static',
    }
  }

  if (!segment.startsWith('[') || !segment.endsWith(']')) {
    return {
      raw: segment,
      paramName: segment,
      pathPart: segment,
      type: 'static',
    }
  }

  let inner = segment.slice(1, -1)

  let isOptional = false
  if (inner.endsWith('$')) {
    isOptional = true
    inner = inner.slice(0, -1)
  }

  let isCatchAll = false
  if (inner.startsWith('...')) {
    isCatchAll = true
    inner = inner.slice(3)
  }

  /**
   * catchAll：消费方用固定键 `splat` 捕获完整剩余路径，故 path 段统一为 `**`，
   * 参数名仅用于生成路由 name（不进入 path），无需做标识符校验
   */
  if (isCatchAll) {
    return {
      raw: segment,
      paramName: inner || 'slug',
      pathPart: '**',
      type: 'catchAll',
    }
  }

  /**
   * dynamic / optional：参数名会进入 path（`:name`），必须是合法标识符
   * 否则 `[2fa]`/`[a/b]`/`[ id ]` 这类会让 path-to-regexp 在匹配期抛错、拖垮整个路由
   */
  if (!VALID_PARAM_NAME.test(inner)) {
    throw new Error(
      `[vite-auto-route] 非法路由参数名 "${inner}"（来自目录 "${segment}"）：`
      + `参数名须以字母/下划线/$ 开头、仅含单词字符，否则会导致 path-to-regexp 匹配期抛错`,
    )
  }

  return {
    raw: segment,
    paramName: inner,
    pathPart: `:${inner}${isOptional
      ? '?'
      : ''}`,
    type: isOptional
      ? 'optional'
      : 'dynamic',
  }
}
