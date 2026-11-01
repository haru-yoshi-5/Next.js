"use client"

import { CircleAlertIcon, CircleCheckIcon, LoaderIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useActionState, useTransition } from "react"

import { DemoLayout } from "@/components/learning/demo-layout"
import { Button } from "@/components/ui/button"
import { ProcessVisualizer } from "@/components/visualizer/process-visualizer"
import { cn } from "@/lib/utils"
import type { FlowTrace } from "@/types/flow"

import { initialInvalidateState, invalidateMethods } from "./action-state"
import { invalidate } from "./actions"
import { buildRevalidationTrace, staleWhileRevalidateModel } from "./trace"

const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
})

interface RevalidationPanelProps {
  /** サーバーで読み取ったキャッシュの値 */
  value: { id: string; generatedAt: number }
}

// useActionState とボタンの操作を扱うため Client Component。
// 失効の処理そのものは actions.ts の Server Action がサーバーで行う。
export function RevalidationPanel({ value }: RevalidationPanelProps) {
  const router = useRouter()
  const [isRefreshing, startTransition] = useTransition()
  const [state, formAction, isPending] = useActionState(
    invalidate,
    initialInvalidateState,
  )
  const isBusy = isPending || isRefreshing
  const hasError = state.status === "error"

  const pendingTrace: FlowTrace = {
    id: "invalidate-pending",
    title: "Server Action の実行",
    source: "measured",
    live: true,
    steps: [
      {
        id: "submit",
        from: "client-component",
        to: "next-server",
        label: "ボタンから Server Action を呼び出す（POST）",
        detail: "サーバーからの応答を待っています",
      },
    ],
  }

  const resultTrace =
    state.status === "success"
      ? buildRevalidationTrace({
          operationId: state.operationId,
          method: state.method,
          beforeId: state.beforeId,
          afterId: value.id,
        })
      : staleWhileRevalidateModel

  return (
    <DemoLayout
      runtime="client"
      runtimeDetail="操作ボタン"
      demo={
        <div className="flex flex-col gap-5">
          <dl className="grid gap-px overflow-hidden rounded-lg border bg-border text-sm">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 bg-background px-3 py-2">
              <dt className="text-muted-foreground">現在の生成ID</dt>
              <dd className="font-mono tabular-nums">{value.id}</dd>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 bg-background px-3 py-2">
              <dt className="text-muted-foreground">生成時刻（JST）</dt>
              <dd className="font-mono tabular-nums">
                {timeFormatter.format(value.generatedAt)}
              </dd>
            </div>
          </dl>

          <form action={formAction} className="flex flex-col gap-2">
            <p className="text-sm font-medium">キャッシュを失効させる</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {invalidateMethods.map((method) => (
                <Button
                  key={method}
                  type="submit"
                  name="method"
                  value={method}
                  variant="outline"
                  disabled={isBusy}
                  className="font-mono"
                >
                  {method}
                </Button>
              ))}
            </div>
          </form>

          <p
            role={hasError ? "alert" : "status"}
            className={cn(
              "flex min-h-5 items-center gap-1.5 text-sm",
              hasError ? "text-destructive" : "text-server",
            )}
          >
            {state.message ? (
              <>
                {hasError ? (
                  <CircleAlertIcon aria-hidden className="size-4" />
                ) : (
                  <CircleCheckIcon aria-hidden className="size-4" />
                )}
                {state.message}
              </>
            ) : null}
          </p>

          <div className="flex flex-col gap-3 border-t pt-4">
            <div>
              <Button
                variant="secondary"
                disabled={isBusy}
                onClick={() => startTransition(() => router.refresh())}
              >
                {isRefreshing ? (
                  <LoaderIcon
                    aria-hidden
                    className="motion-safe:animate-spin"
                  />
                ) : null}
                もう一度読み取る
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              この値は閲覧者全員で共有しているため、他の人の操作で変わることもあります。
            </p>
          </div>
        </div>
      }
      visualizer={
        <ProcessVisualizer
          nodes={[
            "browser",
            "client-component",
            "next-server",
            "server-action",
            "cache",
            "server-component",
            "data-source",
          ]}
          trace={isPending ? pendingTrace : resultTrace}
          emptyMessage="ボタンを押すと、失効の処理がここに表示されます"
        />
      }
    />
  )
}
