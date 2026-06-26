import { Link, Outlet, RouterProvider, useLocation } from '@jl-org/react-router'
import { generated, router } from './routes'
import { RouteTree } from './ui'

const NAV: { group: string, links: [string, string][] }[] = [
  {
    group: '基础',
    links: [
      ['/', '首页'],
      ['/about', '/about 静态页'],
    ],
  },
  {
    group: '#1 静态不被动态遮蔽',
    links: [
      ['/posts/new', '/posts/new（新建）'],
      ['/posts/42', '/posts/42（详情）'],
    ],
  },
  {
    group: '嵌套布局 Outlet',
    links: [
      ['/dashboard', '/dashboard'],
      ['/dashboard/settings', '/dashboard/settings'],
      ['/dashboard/team/alice', '/dashboard/team/alice'],
    ],
  },
  {
    group: '#2 catch-all',
    links: [
      ['/files/readme.md', '/files/readme.md'],
      ['/files/docs/v2/intro.md', '/files/docs/v2/intro.md'],
    ],
  },
  {
    group: '可选参数',
    links: [
      ['/docs', '/docs（无参）'],
      ['/docs/getting-started', '/docs/getting-started'],
    ],
  },
]

function NavLink({ to, children }: { to: string, children: React.ReactNode }) {
  const loc = useLocation()
  const active = loc.pathname === to
  return (
    <Link to={to} className={active ? 'nav-link active' : 'nav-link'}>
      {children}
    </Link>
  )
}

export function App() {
  return (
    <RouterProvider router={router}>
      <div className="layout">
        <aside className="sidebar">
          <div className="brand">
            vite-auto-route
            <small>Playground</small>
          </div>

          {NAV.map(g => (
            <div key={g.group} className="nav-group">
              <div className="nav-title">{g.group}</div>
              {g.links.map(([to, label]) => (
                <NavLink key={to} to={to}>{label}</NavLink>
              ))}
            </div>
          ))}

          <details className="config">
            <summary>生成的路由配置</summary>
            <RouteTree routes={generated} />
          </details>
        </aside>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </RouterProvider>
  )
}
