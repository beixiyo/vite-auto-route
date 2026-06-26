import { PageShell } from '../../../ui'

export default function PostNew() {
  return (
    <PageShell title="新建文章 /posts/new" accent="#16a34a">
      <p className="ok">✅ 这是「新建」页面，没有被 <code>/posts/:id</code> 遮蔽。</p>
      <p>
        文件结构：<code>posts/new/page.tsx</code> 与 <code>posts/[id]/page.tsx</code> 并存、且无 <code>posts/page.tsx</code>。
      </p>
      <p>
        修复前：<code>/posts/new</code> 会命中 <code>/posts/:id</code>（id=&quot;new&quot;），本页打不开。
        现在静态路由排在动态前，正确命中。
      </p>
    </PageShell>
  )
}
