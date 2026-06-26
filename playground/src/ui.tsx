import type { ReactNode } from 'react'
import { useLocation, useParams } from '@jl-org/react-router'

/** 统一页面外壳：标题 + 内容 + 当前 path / params / query 实时回显 */
export function PageShell({
  title,
  accent = '#0f172a',
  children,
}: {
  title: string
  accent?: string
  children?: ReactNode
}) {
  const loc = useLocation()
  const { params, query } = useParams()
  const hasQuery = loc.search && Object.keys(query).length > 0

  return (
    <div className="page">
      <h1 className="page-title" style={{ borderColor: accent }}>{title}</h1>
      <div className="page-body">{children}</div>

      <dl className="kv">
        <dt>当前 path</dt>
        <dd><code>{loc.pathname || '/'}</code></dd>
        <dt>params</dt>
        <dd><code>{JSON.stringify(params)}</code></dd>
        {hasQuery
          ? (
              <>
                <dt>query</dt>
                <dd><code>{JSON.stringify(query)}</code></dd>
              </>
            )
          : null}
      </dl>
    </div>
  )
}

/** 递归渲染 genRoutes 生成的路由配置树 */
export function RouteTree({ routes }: { routes: any[] }) {
  return (
    <ul className="tree">
      {routes.map((r, i) => (
        <li key={`${r.path}-${i}`}>
          <code className="tree-path">{r.path}</code>
          {r.name
            ? <span className="tree-name">{r.name}</span>
            : null}
          {r.children?.length
            ? <RouteTree routes={r.children} />
            : null}
        </li>
      ))}
    </ul>
  )
}
