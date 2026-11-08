"use client"

import { RotateCcwIcon, TriangleAlertIcon, Undo2Icon } from "lucide-react"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"

import { useReportDemoEvent } from "./demo-events"
import { DemoView } from "./demo-view"

const wrapButtonClass =
  "h-auto min-h-8 max-w-full justify-start py-1.5 text-left whitespace-normal"

// error.tsx は React のエラー境界になるため、Client Component でなければならない。
// 同じフォルダの page.tsx を包むが、同じフォルダの layout.tsx（教材本体）は包まない。
export default function ErrorFileError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string }
  retry: () => void
  reset: () => void
}) {
  const report = useReportDemoEvent()

  useEffect(() => {
    // 本番では message が伏せられるため、サーバーのログと照合できる digest を残す
    console.error(
      "[error-file] page の描画でエラーが発生しました",
      error.digest ?? error,
    )
    report({
      kind: "error",
      atMs: performance.now(),
      digest: error.digest,
      message: error.message,
    })
  }, [error, report])

  return (
    <DemoView
      file="app/learn/error-file/error.tsx"
      title="レポートを表示できませんでした"
    >
      <div role="alert" className="flex flex-col gap-3">
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <TriangleAlertIcon
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-destructive"
          />
          page.tsx
          の描画中にエラーが発生したため、このファイルが代わりに表示されています。
        </p>
        <dl className="grid gap-1 rounded-md bg-muted/50 px-3 py-2 font-mono text-xs">
          <div className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground">error.message</dt>
            <dd className="break-all">{error.message}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground">error.digest</dt>
            <dd className="break-all">{error.digest ?? "（なし）"}</dd>
          </div>
        </dl>
      </div>
      {/* 狭い画面でも枠からはみ出さないよう、ボタンのラベルを折り返せるようにする */}
      <div className="flex flex-wrap gap-2">
        <Button
          className={wrapButtonClass}
          onClick={(event) => {
            report({ kind: "retry", atMs: event.timeStamp })
            retry()
          }}
        >
          <RotateCcwIcon aria-hidden />
          retry()：取り直して表示
        </Button>
        <Button
          variant="outline"
          className={wrapButtonClass}
          onClick={(event) => {
            report({ kind: "reset", atMs: event.timeStamp })
            reset()
          }}
        >
          <Undo2Icon aria-hidden />
          reset()：取り直さずに表示
        </Button>
      </div>
    </DemoView>
  )
}
