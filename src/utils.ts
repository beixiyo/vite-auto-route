import type { ParsedSegment } from './types'

export function ensureLeadingSlash(value: string) {
  if (!value.startsWith('/'))
    return `/${value}`
  return value
}

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
  if (!segments.length)
    return '/'

  /** 处理 catchall 路由：将 :param* 拆分为 :param 和 /* 两部分 */
  const processedSegments: string[] = []
  for (const segment of segments) {
    if (!segment)
      continue

    /** 检测 catchall 模式（以 * 结尾的参数） */
    if (segment.endsWith('*') && segment.startsWith(':')) {
      /** 将 :param* 拆分为 :param 和 */
      const paramPart = segment.slice(0, -1) // 移除末尾的 *
      processedSegments.push(paramPart, '*')
    }
    else {
      processedSegments.push(segment)
    }
  }

  const joined = processedSegments.join('/')
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

  const paramName = inner || 'slug'
  if (isCatchAll) {
    return {
      raw: segment,
      paramName,
      pathPart: `:${paramName}*`,
      type: 'catchAll',
    }
  }

  return {
    raw: segment,
    paramName,
    pathPart: `:${paramName}${isOptional
      ? '?'
      : ''}`,
    type: isOptional
      ? 'optional'
      : 'dynamic',
  }
}
