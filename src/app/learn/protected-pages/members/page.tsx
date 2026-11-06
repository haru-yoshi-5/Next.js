import { DemoPageView } from "../demo-page-view"
import { MemberArea } from "../member-area"

// ページ（Server Component）で確かめて守る。Proxy はこのページでは動かない。
// 見出しと説明は静的な部分として先に送られ、未ログインなら <Suspense> の中でリダイレクトする。
export default function MembersPage() {
  return (
    <DemoPageView
      file="app/learn/protected-pages/members/page.tsx"
      title="会員ページ（ページで確認）"
      description="このページは、描画の中で readMemberArea() がセッションを確かめます。未ログインなら、お知らせを読む前にログインページへリダイレクトします。"
      fallback="サーバーでセッションを確認しています…"
    >
      <MemberArea page="members" />
    </DemoPageView>
  )
}
