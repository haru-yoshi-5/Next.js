"use client"

import { CircleAlertIcon, LoaderIcon, ZapIcon } from "lucide-react"
import {
  type ReactNode,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react"

import { DemoLayout } from "@/components/learning/demo-layout"
import { Button } from "@/components/ui/button"
import { ProcessVisualizer } from "@/components/visualizer/process-visualizer"
import { RuntimeBadge } from "@/components/visualizer/runtime-badge"
import type { FlowTrace } from "@/types/flow"

import { startOutage } from "./actions"
import { OUTAGE_MS } from "./demo-config"
import {
  type DemoEvent,
  type DemoEventKind,
  DemoEventsContext,
} from "./demo-events"
import { buildErrorTrace, errorModel } from "./trace"

/** 記録に残す出来事の最大数 */
const MAX_EVENTS = 10

const EVENT_LABEL: Record<DemoEventKind, string> = {
  outage: "一時的な障害を起こした",
  error: "error.tsx に切り替わった",
  retry: "retry() を押した",
  reset: "reset() を押した",
  recovered: "page の表示に戻った",
}

const formatSec = (ms: number) =>
  `${(ms / 1000).toLocaleString("ja-JP", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}秒`

// layout.tsx から描画される Client Component。
// layout はエラーの影響を受けないため、ここで持つ記録や操作ボタンは error.tsx に切り替わっても残る。
export function ErrorDemoPanel({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<DemoEvent[]>([])
  const [outageCount, setOutageCount] = useState(0)
  const [remainingMs, setRemainingMs] = useState(0)
  const [actionError, setActionError] = useState(false)
  const [isPending, startTransition] = useTransition()

  const report = useCallback((event: DemoEvent) => {
    setEvents((current) => {
      // 障害を起こす前の表示（ページを開いたときの描画など）は記録しない
      if (current.length === 0) return current
      const last = current.at(-1)
      // 同じ表示が続けて報告された場合（同じエラーの再表示など）は1回として扱う
      if (
        last?.kind === event.kind &&
        (event.kind === "error" || event.kind === "recovered") &&
        last.digest === event.digest
      ) {
        return current
      }
      return [...current, event].slice(-MAX_EVENTS)
    })
  }, [])

  const trace: FlowTrace =
    events.length > 0 ? buildErrorTrace(events) : errorModel

  // 障害を起こしたら、終わるまでの目安を数える（サーバーとの時計のずれを避けるため、ブラウザの時計で数える）
  useEffect(() => {
    if (outageCount === 0) return
    const deadline = Date.now() + OUTAGE_MS
    const timer = setInterval(() => {
      const ms = Math.max(0, deadline - Date.now())
      setRemainingMs(ms)
      if (ms === 0) clearInterval(timer)
    }, 100)
    return () => clearInterval(timer)
  }, [outageCount])

  function handleOutage(clickedAt: number) {
    setEvents([{ kind: "outage", atMs: clickedAt }])
    setActionError(false)
    setRemainingMs(OUTAGE_MS)
    startTransition(async () => {
      try {
        await startOutage()
        setOutageCount((count) => count + 1)
      } catch (error) {
        console.error("[error-file] 障害を起こせませんでした", error)
        setEvents([])
        setRemainingMs(0)
        setActionError(true)
      }
    })
  }

  const inOutage = remainingMs > 0

  return (
    <DemoEventsContext value={report}>
      <DemoLayout
        runtime="client"
        runtimeDetail="layout.tsx 内のパネル"
        demo={
          <div className="flex flex-col gap-4">
            <section className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  disabled={isPending || inOutage}
                  onClick={(event) => handleOutage(event.timeStamp)}
                >
                  {isPending ? (
                    <LoaderIcon
                      aria-hidden
                      className="motion-safe:animate-spin"
                    />
                  ) : (
                    <ZapIcon aria-hidden />
                  )}
                  {OUTAGE_MS / 1000}秒間の障害を起こす
                </Button>
                <p
                  role="status"
                  className="font-mono text-xs text-muted-foreground tabular-nums"
                >
                  {inOutage
                    ? `障害中: あと約${formatSec(remainingMs)}`
                    : "障害は起きていません"}
                </p>
              </div>
              {actionError ? (
                <p
                  role="alert"
                  className="flex items-center gap-1.5 text-sm text-destructive"
                >
                  <CircleAlertIcon aria-hidden className="size-4 shrink-0" />
                  障害を起こせませんでした。通信状況を確認して、もう一度お試しください。
                </p>
              ) : null}
              <p className="text-xs leading-relaxed text-muted-foreground">
                障害中は page.tsx の描画が失敗します。障害の間と終わった後に
                retry() と reset() を押して、回復できるかを比べましょう。
              </p>
            </section>

            <div className="rounded-lg border border-dashed border-server/40 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-[0.7rem] text-muted-foreground">
                  {"{children}"}
                </p>
                <RuntimeBadge runtime="server" detail="page / error" />
              </div>
              {children}
            </div>

            <section className="flex flex-col gap-2">
              <h4 className="text-sm font-medium">出来事の記録</h4>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  まだ記録はありません。障害を起こすと、ここに出来事が順に残ります。
                </p>
              ) : (
                <ol className="flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm">
                  {events.map((event, index) => (
                    <li
                      key={`${event.kind}-${index}`}
                      className="flex flex-wrap gap-x-3"
                    >
                      <span className="w-14 shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                        +{formatSec(event.atMs - events[0].atMs)}
                      </span>
                      <span>{EVENT_LABEL[event.kind]}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        }
        visualizer={
          <ProcessVisualizer
            nodes={[
              "browser",
              "client-component",
              "server-action",
              "server-component",
            ]}
            trace={trace}
            emptyMessage="障害を起こすと、処理がここに表示されます"
          />
        }
      />
    </DemoEventsContext>
  )
}
