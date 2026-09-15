"use client"

import { LoaderIcon, RotateCcwIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { flowNodes } from "@/components/visualizer/flow-nodes"
import {
  formatDuration,
  ProcessEdge,
  type ProcessEdgeState,
} from "@/components/visualizer/process-edge"
import {
  ProcessNode,
  type ProcessNodeState,
} from "@/components/visualizer/process-node"
import { RuntimeBadge } from "@/components/visualizer/runtime-badge"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { cn } from "@/lib/utils"
import type { FlowNodeId, FlowTrace } from "@/types/flow"

/** 1ステップを表示してから次へ進むまでの時間 */
const STEP_INTERVAL_MS = 650

interface ProcessVisualizerProps {
  /** 表示するノード（左から Client → Server の順に並べ替えて表示） */
  nodes: FlowNodeId[]
  trace: FlowTrace | null
  /** まだ操作していないときの案内 */
  emptyMessage: string
  className?: string
}

interface Playback {
  traceId: string | null
  /** 表示済みステップ数 */
  shown: number
}

/**
 * 操作によって発生した処理（FlowTrace）を、ステップごとに順番に再生して見せる。
 *
 * ステップの間隔は「人が目で追える速さ」にするための演出で、実際の処理時間は
 * 各ステップ右側の計測値（durationMs）で示す。
 */
export function ProcessVisualizer({
  nodes,
  trace,
  emptyMessage,
  className,
}: ProcessVisualizerProps) {
  const reducedMotion = usePrefersReducedMotion()
  const [playback, setPlayback] = useState<Playback>({
    traceId: null,
    shown: 0,
  })

  // 新しい操作（trace.id の変化）を検知したら、レンダー中に再生位置をリセットする。
  // Effect で同期するより再レンダーが1回少なく、古い状態が一瞬表示されることもない。
  if (trace && playback.traceId !== trace.id) {
    setPlayback({ traceId: trace.id, shown: 0 })
  }

  const stepCount = trace?.steps.length ?? 0
  const isCurrent = trace !== null && playback.traceId === trace.id
  const shown = isCurrent ? Math.min(playback.shown, stepCount) : 0
  const isPlaying = isCurrent && shown < stepCount

  // 再生はタイマー（外部システム）との同期なので Effect を使う
  useEffect(() => {
    if (!isPlaying) return
    const timer = window.setTimeout(
      () => setPlayback((prev) => ({ ...prev, shown: prev.shown + 1 })),
      reducedMotion ? 0 : shown === 0 ? 80 : STEP_INTERVAL_MS,
    )
    return () => window.clearTimeout(timer)
  }, [isPlaying, shown, reducedMotion])

  const steps = trace?.steps ?? []
  const activeStep = shown > 0 ? steps[shown - 1] : undefined
  const isComplete = trace !== null && !isPlaying && !trace.live && shown > 0

  const nodeState = (id: FlowNodeId): ProcessNodeState => {
    if (
      activeStep &&
      (isComplete
        ? activeStep.to === id
        : activeStep.to === id || activeStep.from === id)
    ) {
      return "active"
    }
    const visited = steps
      .slice(0, shown)
      .some((step) => step.from === id || step.to === id)
    return visited ? "visited" : "idle"
  }

  const edgeState = (index: number): ProcessEdgeState => {
    if (index >= shown) return "pending"
    if (index === shown - 1 && !isComplete) return "active"
    return "done"
  }

  const clientNodes = nodes.filter((id) => flowNodes[id].runtime === "client")
  const serverNodes = nodes.filter((id) => flowNodes[id].runtime === "server")
  const measuredTotal = steps
    .slice(0, shown)
    .reduce((total, step) => total + (step.durationMs ?? 0), 0)
  const showTotal =
    !trace?.hideTotal && steps.some((step) => step.durationMs !== undefined)

  return (
    <section
      aria-label="Process Visualizer"
      className={cn(
        "flex min-w-0 flex-col rounded-xl border bg-card",
        className,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <p className="font-mono text-[0.7rem] tracking-wider text-muted-foreground">
            PROCESS VISUALIZER
          </p>
          <p className="truncate text-sm font-medium">
            {trace?.title ?? "操作を待っています"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {trace ? (
            <span
              className={cn(
                "rounded-md border px-1.5 py-0.5 text-[0.65rem] font-medium",
                trace.source === "measured"
                  ? "border-server/30 text-server"
                  : "border-border text-muted-foreground",
              )}
              title={
                trace.source === "measured"
                  ? "実際に発生した操作と、サーバー / ブラウザで取得した値から組み立てています"
                  : "ブラウザからは観測できない内部処理を、公式ドキュメントに沿って図示しています"
              }
            >
              {trace.source === "measured" ? "実データ" : "モデル図"}
            </span>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            disabled={!trace || isPlaying}
            onClick={() => setPlayback((prev) => ({ ...prev, shown: 0 }))}
          >
            <RotateCcwIcon aria-hidden />
            再生
          </Button>
        </div>
      </header>

      <div className="grid gap-3 border-b p-4 sm:grid-cols-2">
        <NodeZone runtime="client" title="ブラウザ側">
          {clientNodes.map((id) => (
            <ProcessNode key={id} id={id} state={nodeState(id)} />
          ))}
        </NodeZone>
        <NodeZone runtime="server" title="サーバー側">
          {serverNodes.map((id) => (
            <ProcessNode key={id} id={id} state={nodeState(id)} />
          ))}
        </NodeZone>
      </div>

      <div className="flex-1 p-2">
        {trace ? (
          <ol aria-label="処理ステップ" className="flex flex-col">
            {steps.map((step, index) => (
              <ProcessEdge
                key={step.id}
                step={step}
                index={index}
                state={edgeState(index)}
              />
            ))}
            {trace.live && !isPlaying ? (
              <li className="flex items-center gap-3 px-2 py-2 text-xs text-muted-foreground">
                <LoaderIcon
                  aria-hidden
                  className="size-4 motion-safe:animate-spin"
                />
                次のチャンクを待っています…
              </li>
            ) : null}
          </ol>
        ) : (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        )}
      </div>

      <footer className="flex items-center justify-between gap-2 border-t px-4 py-2.5 text-xs text-muted-foreground">
        <p aria-live="polite">
          {activeStep
            ? `${shown} / ${stepCount}: ${activeStep.label}`
            : "待機中"}
        </p>
        {showTotal ? (
          <p className="font-mono tabular-nums">
            計測合計 {formatDuration(measuredTotal)}
          </p>
        ) : null}
      </footer>
    </section>
  )
}

function NodeZone({
  runtime,
  title,
  children,
}: {
  runtime: "client" | "server"
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-dashed p-2.5",
        runtime === "client" ? "border-client/40" : "border-server/40",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{title}</p>
        <RuntimeBadge runtime={runtime} />
      </div>
      <ul className="flex flex-col gap-1.5">{children}</ul>
    </div>
  )
}
