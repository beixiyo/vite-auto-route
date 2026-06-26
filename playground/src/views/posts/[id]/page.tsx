import { useParams } from '@jl-org/react-router'
import { PageShell } from '../../../ui'

export default function PostDetail() {
  const { params } = useParams()
  return (
    <PageShell title="文章详情 /posts/:id" accent="#7c3aed">
      <p>
        动态参数 id =
        {' '}
        <b>{String(params.id)}</b>
      </p>
      <p>由 <code>posts/[id]/page.tsx</code> 生成；只有非 <code>/posts/new</code> 的路径才会命中这里。</p>
    </PageShell>
  )
}
