import { LoaderIcon } from "lucide-react"
import { Suspense } from "react"

import { DemoView } from "./demo-view"
import { InventoryReport } from "./inventory-report"

// /learn/error-file で layout.tsx の children として表示される。
// InventoryReport が throw すると、同じフォルダの error.tsx がこのページの代わりに表示される。
export default function ErrorFilePage() {
  return (
    <DemoView file="app/learn/error-file/page.tsx" title="在庫レポート">
      {/*
        InventoryReport は cookie を読むため、リクエストのたびに描画する。
        <Suspense> で囲み、教材本体（layout）をビルド時の静的な部分に残す。
      */}
      <Suspense
        fallback={
          <p
            role="status"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <LoaderIcon
              aria-hidden
              className="size-4 motion-safe:animate-spin"
            />
            レポートを読み込んでいます…
          </p>
        }
      >
        <InventoryReport />
      </Suspense>
    </DemoView>
  )
}
