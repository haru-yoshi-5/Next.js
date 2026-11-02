"use client"

import { LoaderIcon, RefreshCwIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { type ReactNode, useTransition } from "react"

import { DemoLayout } from "@/components/learning/demo-layout"
import { Button } from "@/components/ui/button"
import { ProcessVisualizer } from "@/components/visualizer/process-visualizer"
import { RuntimeBadge } from "@/components/visualizer/runtime-badge"
import type { FlowTrace } from "@/types/flow"

interface CachePanelProps {
  /** サーバーで組み立てた処理の記録 */
  trace: FlowTrace
  /** Server Component が描画した結果 */
  children: ReactNode
}

// ボタンのクリックを扱うため Client Component にしている。
// 読み取りとキャッシュの判定は Server Component（cache-demo.tsx）が担当する。
export function CachePanel({ trace, children }: CachePanelProps) {
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
                もう一度リクエスト
              </Button>
              <RuntimeBadge runtime="client" detail="このボタンだけ" />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              このキャッシュは閲覧者全員で共有しています。他の人が直前に開いていれば、初回から読み取り前に生成された結果を受け取ります。
            </p>
          </div>
        </div>
      }
      visualizer={
        <ProcessVisualizer
          nodes={[
            "browser",
            "next-server",
            "server-component",
            "cache",
            "data-source",
          ]}
          trace={trace}
          emptyMessage="サーバーからの結果を待っています"
        />
      }
    />
  )
}
