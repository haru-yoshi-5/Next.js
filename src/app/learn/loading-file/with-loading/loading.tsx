import { LoaderIcon } from "lucide-react"

import { DemoView } from "../demo-view"

// with-loading/page.tsx を自動で <Suspense> に包み、描画を待つ間に表示される。
// 静的な内容なのでビルド時に作られ、リンクのプリフェッチで先に読み込まれる。
export default function WithLoadingLoading() {
  return (
    <DemoView
      file="app/learn/loading-file/with-loading/loading.tsx"
      title="読み込み中…"
    >
      {/* data-nsc-loading-fallback は Live Demo が待ちの表示を見つけるための目印 */}
      <div
        role="status"
        data-nsc-loading-fallback=""
        className="flex flex-col gap-2"
      >
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderIcon aria-hidden className="size-4 motion-safe:animate-spin" />
          ページを読み込んでいます（loading.tsx）
        </p>
        <div className="h-4 w-3/4 rounded bg-muted motion-safe:animate-pulse" />
        <div className="h-12 rounded-md bg-muted/50 motion-safe:animate-pulse" />
      </div>
    </DemoView>
  )
}
