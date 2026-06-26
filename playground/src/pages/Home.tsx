import { PageShell } from '../ui'

export function Home() {
  return (
    <PageShell title="首页 /" accent="#0f172a">
      <p>
        左侧每个链接对应一条
        {' '}
        <code>genRoutes</code>
        {' '}
        从
        {' '}
        <code>src/views/**/page.tsx</code>
        {' '}
        自动生成、并交给
        {' '}
        <code>@jl-org/react-router</code>
        {' '}
        渲染的真实路由。
      </p>
      <p>点击导航，页面会实时显示当前 path 与匹配到的 params；底部可展开查看完整的生成配置。</p>
      <ul className="hint">
        <li><b>#1</b> <code>/posts/new</code> 不再被 <code>/posts/:id</code> 遮蔽</li>
        <li><b>#2</b> <code>/files/**</code> catch-all 真正捕获任意层级路径（<code>params.splat</code>）</li>
        <li>嵌套布局：<code>/dashboard</code> 通过 <code>&lt;Outlet/&gt;</code> 承载子路由</li>
        <li>可选参数：<code>/docs</code> 与 <code>/docs/:chapter?</code> 同一路由</li>
      </ul>
    </PageShell>
  )
}
