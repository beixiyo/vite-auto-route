import { useParams } from '@jl-org/react-router'
import { PageShell } from '../../../ui'

export default function Files() {
  const { params } = useParams()
  return (
    <PageShell title="文件 catch-all /files/**" accent="#ca8a04">
      <p className="ok">✅ catch-all 捕获任意层级的剩余路径。</p>
      <p>
        params.splat =
        {' '}
        <b>{JSON.stringify(params.splat)}</b>
      </p>
      <p>
        由 <code>files/[...slug]/page.tsx</code> 生成 <code>/files/**</code>。修复前它会变成 <code>/files/:slug/*</code>，
        只能匹配「正好多一段」，<code>/files/a</code> 和 <code>/files/a/b/c</code> 都会 404。
      </p>
    </PageShell>
  )
}
