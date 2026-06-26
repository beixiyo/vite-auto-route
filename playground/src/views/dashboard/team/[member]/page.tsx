import { useParams } from '@jl-org/react-router'
import { PageShell } from '../../../../ui'

export default function TeamMember() {
  const { params } = useParams()
  return (
    <PageShell title="成员 /dashboard/team/:member" accent="#be185d">
      <p>
        参数 member =
        {' '}
        <b>{String(params.member)}</b>
      </p>
      <p>
        嵌套动态路由：<code>team/</code> 目录无 page，<code>[member]</code> 仍正确嵌套进 <code>/dashboard</code> 布局下。
      </p>
    </PageShell>
  )
}
