import { DemoPageView } from "../demo-page-view"
import { MemberArea } from "../member-area"

// Proxy とページの両方で確かめて守る。
// Proxy（src/proxy.ts）が描画の前に cookie の署名を確かめ、通ったリクエストだけがここまで届く。
// Proxy は素早く振り分けるための確認なので、ページでも members と同じ確認をもう一度行う。
export default function ProxiedPage() {
  return (
    <DemoPageView
      file="app/learn/protected-pages/proxied/page.tsx"
      title="会員ページ（Proxy でも確認）"
      description="このページは、描画の前に Proxy が cookie の署名を確かめ、描画の中でもう一度 readMemberArea() が確かめます。"
      fallback="サーバーでセッションを確認しています…"
    >
      <MemberArea page="proxied" />
    </DemoPageView>
  )
}
