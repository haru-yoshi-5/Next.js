import { DemoView } from "../demo-view"
import { SlowContent } from "../slow-content"

// 同じフォルダの loading.tsx が、このページ全体を <Suspense> で包む。
// 描画を待つ間は、このページの代わりに loading.tsx の表示が出る。
export default function WithLoadingPage() {
  return (
    <DemoView
      file="app/learn/loading-file/with-loading/page.tsx"
      title="loading.tsx あり"
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        描画を待つ間は、同じフォルダの loading.tsx
        がこのページの代わりに表示されていました。
      </p>
      <SlowContent page="with-loading" />
    </DemoView>
  )
}
