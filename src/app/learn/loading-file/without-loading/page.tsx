import { DemoView } from "../demo-view"
import { SlowContent } from "../slow-content"

// このフォルダには loading.tsx がなく、page の中にも <Suspense> がない。
// そのため遷移しても待ちの表示に切り替わらず、描画が終わるまで前の画面が残る。
export default function WithoutLoadingPage() {
  return (
    <DemoView
      file="app/learn/loading-file/without-loading/page.tsx"
      title="loading.tsx なし"
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        待ちの表示がないため、描画が終わるまで前の画面が表示されたままでした。
      </p>
      <SlowContent page="without-loading" />
    </DemoView>
  )
}
