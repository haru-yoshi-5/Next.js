"use client"

import { LoaderIcon, RefreshCwIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { type ReactNode, useTransition } from "react"

import { DemoLayout } from "@/components/learning/demo-layout"
import { Button } from "@/components/ui/button"
import { ProcessVisualizer } from "@/components/visualizer/process-visualizer"
import { RuntimeBadge } from "@/components/visualizer/runtime-badge"
import type { FlowTrace } from "@/types/flow"

interface RefreshPanelProps {
  /** サーバーで組み立てた処理の記録 */
  trace: FlowTrace
  /** Server Component が描画した結果 */
  children: ReactNode
}

// ボタンのクリックを扱うため Client Component にしている。
// データの取得と表示は Server Component（server-snapshot.tsx）が担当する。
export function RefreshPanel({ trace, children }: RefreshPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <DemoLayout
      runtime="server"
      runtimeDetail="Server Component の描画結果"
      demo={
        <div className="flex flex-col gap-5">
          {children}
          <div className="flex flex-col gap-3 border-t pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => startTransition(() => router.refresh())}
                disabled={isPending}
              >
                {isPending ? (
                  <LoaderIcon
                    aria-hidden
                    className="motion-safe:animate-spin"
                  />
                ) : (
                  <RefreshCwIcon aria-hidden />
                )}
                サーバーで再レンダリング
              </Button>
              <RuntimeBadge runtime="client" detail="このボタンだけ" />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              <code className="font-mono">router.refresh()</code>{" "}
              がサーバーへ新しい RSC Payload を要求し、ServerSnapshot
              がもう一度サーバーで実行されます。ページ全体の再読み込み（F5）でも同じ流れになります。
            </p>
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
