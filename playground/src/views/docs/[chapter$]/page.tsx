import { useParams } from '@jl-org/react-router'
import { PageShell } from '../../../ui'

export default function Docs() {
  const { params } = useParams()
  const chapter = params.chapter
  return (
    <PageShell title="文档 /docs/:chapter?" accent="#4f46e5">
      <p>
        可选参数 chapter =
        {' '}
        <b>{chapter == null ? '（未提供）' : String(chapter)}</b>
      </p>
      <p>
        由 <code>docs/[chapter$]/page.tsx</code> 生成 <code>/docs/:chapter?</code>，
        <code>/docs</code> 与 <code>/docs/getting-started</code> 命中同一路由。
      </p>
    </PageShell>
  )
}
