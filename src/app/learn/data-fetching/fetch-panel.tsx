"use client"

import { LoaderIcon, RefreshCwIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { type ReactNode, useTransition } from "react"

import { DemoLayout } from "@/components/learning/demo-layout"
import { Button } from "@/components/ui/button"
import { ProcessVisualizer } from "@/components/visualizer/process-visualizer"
import { RuntimeBadge } from "@/components/visualizer/runtime-badge"
import type { FlowTrace } from "@/types/flow"

interface FetchPanelProps {
  /** サーバーで組み立てた処理の記録 */
  trace: FlowTrace
  /** Server Component が描画した結果 */
  children: ReactNode
}

// ボタンのクリックを扱うため Client Component にしている。
// データの取得と計測は Server Component（fetch-demo.tsx）が担当する。
export function FetchPanel({ trace, children }: FetchPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <DemoLayout
      runtime="server"
      runtimeDetail="Server Component の描画結果"
      demo={
        <div className="flex flex-col gap-5">
          {children}
          <div className="flex flex-wrap items-center gap-3 border-t pt-4">
            <Button
              onClick={() => startTransition(() => router.refresh())}
              disabled={isPending}
            >
              {isPending ? (
                <LoaderIcon aria-hidden className="motion-safe:animate-spin" />
              ) : (
                <RefreshCwIcon aria-hidden />
              )}
              もう一度取得する
            </Button>
            <RuntimeBadge runtime="client" detail="このボタンだけ" />
          </div>
        </div>
      }
      visualizer={
        <ProcessVisualizer
          nodes={["browser", "next-server", "server-component", "data-source"]}
          trace={trace}
          emptyMessage="サーバーからの結果を待っています"
        />
      }
    />
  )
}
