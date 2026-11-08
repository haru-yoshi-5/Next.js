import { DemoPageView } from "../demo-page-view"
import { LoginArea } from "../login-area"

// デモのログインページ。守られたページから ?next=（戻り先）付きでリダイレクトされてくる。
// ?next= はリクエスト時の値なので、読む部分は <Suspense> の中（LoginArea）に置く。
export default function LoginPage({
  searchParams,
}: PageProps<"/learn/protected-pages/login">) {
  return (
    <DemoPageView
      file="app/learn/protected-pages/login/page.tsx"
      title="ログインページ"
      description="守られたページから送られてきたときは、URL の ?next= に戻り先が入っています。ログインすると、戻り先を確かめてから元のページへ戻ります。"
      fallback="戻り先とセッションを確認しています…"
    >
      <LoginArea searchParams={searchParams} />
    </DemoPageView>
  )
}
