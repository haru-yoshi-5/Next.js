import { DemoPageView } from "./demo-page-view"
import { ViewerCard } from "./viewer-card"

// Live Demo の枠の最初の表示。誰でも見られるページで、守る内容はない。
// 教材の本文は layout.tsx にあり、枠の中だけがこのページ・ログインページ・会員ページに切り替わる。
export default function ProtectedPagesDemoHome() {
  return (
    <DemoPageView
      file="app/learn/protected-pages/page.tsx"
      title="デモの入口"
      description="ここは誰でも見られるページです。上のリンクで会員ページへ移動すると、ログインしていなければログインページへ送られます。"
      fallback="サーバーでセッションを確認しています…"
    >
      <ViewerCard />
    </DemoPageView>
  )
}
