import { LoaderIcon } from "lucide-react"
import { Suspense } from "react"

import { DemoView } from "../demo-view"
import { SlowContent } from "../slow-content"

// loading.tsx は使わず、遅い部分だけを <Suspense> で囲む。
// 見出しと説明はビルド時の静的な部分になり、遷移するとすぐに表示される。
export default function WithSuspensePage() {
  return (
    <DemoView
      file="app/learn/loading-file/with-suspense/page.tsx"
      title="page 内の <Suspense>"
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        この見出しと説明は待たずに表示され、下の部分だけが後から届きました。
      </p>
      <Suspense
        fallback={
          // data-nsc-suspense-fallback は Live Demo が待ちの表示を見つけるための目印
          <p
            role="status"
            data-nsc-suspense-fallback=""
            className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
          >
            <LoaderIcon
              aria-hidden
              className="size-4 motion-safe:animate-spin"
            />
            この部分を読み込んでいます（Suspense の fallback）
          </p>
        }
      >
        <SlowContent page="with-suspense" />
      </Suspense>
    </DemoView>
  )
}
