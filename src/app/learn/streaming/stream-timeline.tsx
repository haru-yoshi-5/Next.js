"use client"

import { PlayIcon } from "lucide-react"
import Link from "next/link"
import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useMemo,
  useState,
} from "react"

import { DemoLayout } from "@/components/learning/demo-layout"
import { buttonVariants } from "@/components/ui/button"
import { ProcessVisualizer } from "@/components/visualizer/process-visualizer"
import type { FlowStep, FlowTrace } from "@/types/flow"

interface Arrival {
  id: string
  label: string
  serverMs: number
}

interface StreamTimelineContextValue {
  reportArrival: (arrival: Arrival) => void
}

const StreamTimelineContext = createContext<StreamTimelineContextValue | null>(
  null,
)

export function useStreamTimeline() {
  const context = use(StreamTimelineContext)
  if (!context) {
    throw new Error(
      "useStreamTimeline は StreamTimeline の内側で使用してください",
    )
  }
  return context
}

/** Suspense 境界の数（すべて届いたらストリーミング完了） */
const BOUNDARY_COUNT = 2

interface StreamTimelineProps {
  /** 何回目のストリーミングか（URL の ?run=） */
  run: number
  /** Server Components（Header / Suspense 境界） */
  children: ReactNode
}

// 届いたチャンクを state で記録するため Client Component。
// children の中身（Profile / Activity）はサーバーで描画され、ストリーミングで届く。
export function StreamTimeline({ run, children }: StreamTimelineProps) {
  const [arrivals, setArrivals] = useState<Arrival[]>([])

  const reportArrival = useCallback((arrival: Arrival) => {
    setArrivals((previous) =>
      previous.some((item) => item.id === arrival.id)
        ? previous
        : [...previous, arrival],
    )
  }, [])

  const contextValue = useMemo(() => ({ reportArrival }), [reportArrival])

  const trace: FlowTrace = {
    id: `stream-${run}`,
    title: `Streaming（${run} 回目）`,
    source: "measured",
    live: arrivals.length < BOUNDARY_COUNT,
    hideTotal: true,
    steps: [
      {
        id: "request",
        from: "browser",
        to: "next-server",
        label: "ページをリクエスト",
      },
      {
        id: "shell",
        from: "next-server",
        to: "browser",
        label: "Header と fallback を先に送信",
        detail: "Suspense の外側は、データ取得を待たずに表示される",
      },
      ...arrivals.flatMap<FlowStep>((arrival) => [
        {
          id: `${arrival.id}-ready`,
          from: "server-component",
          to: "next-server",
          label: `<${arrival.label}Section /> の描画が完了`,
          detail: "右の時間は、リクエスト開始からの経過時間（サーバーで計測）",
          durationMs: arrival.serverMs,
        },
        {
          id: `${arrival.id}-chunk`,
          from: "next-server",
          to: "browser",
          label: `${arrival.label} のチャンクを送信し、fallback と差し替え`,
        },
      ]),
    ],
  }

  return (
    <StreamTimelineContext value={contextValue}>
      <DemoLayout
        runtime="server"
        runtimeDetail="Suspense + Server Components"
        demo={
          <div className="flex flex-col gap-4">
            {children}
            <div className="flex flex-wrap items-center gap-3 border-t pt-4">
              <Link
                href={`/learn/streaming?run=${run + 1}`}
                scroll={false}
                className={buttonVariants()}
              >
                <PlayIcon aria-hidden />
                もう一度ストリーミング
              </Link>
              <p className="text-xs text-muted-foreground">
                URL の run を変えて、Suspense 境界を作り直します。
              </p>
            </div>
          </div>
        }
        visualizer={
          <ProcessVisualizer
            nodes={["browser", "next-server", "server-component"]}
            trace={trace}
            emptyMessage="ストリーミングを待っています"
          />
        }
      />
    </StreamTimelineContext>
  )
}
