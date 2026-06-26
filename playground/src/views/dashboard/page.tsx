import { Link, Outlet } from '@jl-org/react-router'

export default function DashboardLayout() {
  return (
    <div className="page">
      <h1 className="page-title" style={{ borderColor: '#d97706' }}>Dashboard 布局 /dashboard</h1>
      <div className="page-body">
        <p>这是一个带 <code>&lt;Outlet/&gt;</code> 的布局路由，子路由会渲染在下方虚线框内。</p>
        <nav className="subnav">
          <Link to="/dashboard/settings">settings</Link>
          <Link to="/dashboard/team/alice">team/alice</Link>
        </nav>
        <div className="outlet-box">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
