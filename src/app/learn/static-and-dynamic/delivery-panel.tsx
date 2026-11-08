"use client"

import { CircleAlertIcon, LoaderIcon, TimerIcon } from "lucide-react"
import { type ReactNode, useState } from "react"

import { DemoLayout } from "@/components/learning/demo-layout"
import { Button } from "@/components/ui/button"
import { ProcessVisualizer } from "@/components/visualizer/process-visualizer"
import type { FlowTrace } from "@/types/flow"

import { type DeliveryMeasurement, measureDelivery } from "./measure-delivery"
import { buildDeliveryTrace, deliveryModel } from "./trace"

/** 表に残す計測の回数 */
const MAX_RUNS = 5

interface DeliveryRun extends DeliveryMeasurement {
  number: number
}

type MeasureStatus = "idle" | "loading" | "error"

// 計測の状態とクリックを扱うため Client Component。
// children の出力はサーバーで作られ、このファイルには含まれない。
export function DeliveryPanel({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<MeasureStatus>("idle")
  const [runs, setRuns] = useState<DeliveryRun[]>([])
  const [trace, setTrace] = useState<FlowTrace>(deliveryModel)

  async function measure() {
    setStatus("loading")
    try {
      const measurement = await measureDelivery()
      const number = (runs.at(-1)?.number ?? 0) + 1
      setRuns([...runs, { ...measurement, number }].slice(-MAX_RUNS))
      setTrace(buildDeliveryTrace(crypto.randomUUID(), measurement))
      setStatus("idle")
    } catch (error) {
      console.error("[measureDelivery] 計測に失敗しました", error)
      setStatus("error")
    }
  }

  const isLoading = status === "loading"

  return (
    <DemoLayout
      runtime="server"
      runtimeDetail="表示する値"
      demo={
        <div className="flex flex-col gap-5">
          {children}

          <section className="flex flex-col gap-3 border-t pt-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-medium">配信を計測</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                このページを取得し直し、応答を読みながら、それぞれの値が届いた時間を記録します。
              </p>
            </div>
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={measure}
              className="self-start"
            >
              {isLoading ? (
                <LoaderIcon aria-hidden className="motion-safe:animate-spin" />
              ) : (
                <TimerIcon aria-hidden />
              )}
              計測する
            </Button>
            <DeliveryResult status={status} runs={runs} />
          </section>
        </div>
      }
      visualizer={
        <ProcessVisualizer
          nodes={["browser", "next-server", "server-component"]}
          trace={trace}
          emptyMessage="操作すると、処理がここに表示されます"
        />
      }
    />
  )
}

function DeliveryResult({
  status,
  runs,
}: {
  status: MeasureStatus
  runs: DeliveryRun[]
}) {
  return (
    <div className="flex flex-col gap-2">
      {status === "error" ? (
        <p
          role="alert"
          className="flex items-center gap-1.5 text-sm text-destructive"
        >
          <CircleAlertIcon aria-hidden className="size-4" />
          計測に失敗しました。時間をおいて再度お試しください。
        </p>
      ) : (
        <p role="status" className="text-sm text-muted-foreground">
          {resultMessage(status, runs)}
        </p>
      )}
      {runs.length > 0 ? <RunsTable runs={runs} /> : null}
    </div>
  )
}

function resultMessage(status: MeasureStatus, runs: DeliveryRun[]) {
  if (status === "loading") return "計測しています…"
  if (runs.length === 0) return "まだ計測していません。"
  if (runs.length === 1) return "もう一度計測して、IDの変化を比べましょう。"

  const shellIds = new Set(runs.map((run) => run.shellId)).size
  const requestIds = new Set(runs.map((run) => run.requestId)).size
  return `${runs.length}回の計測で、シェルIDは${shellIds}種類、リクエストIDは${requestIds}種類でした。`
}

function RunsTable({ runs }: { runs: DeliveryRun[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <caption className="sr-only">配信の計測結果</caption>
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b">
            <th scope="col" className="px-3 py-2 font-medium">
              回
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              シェルID
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              到着
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              リクエストID
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              到着
            </th>
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums">
          {runs.map((run) => (
            <tr key={run.number} className="border-b last:border-b-0">
              <th scope="row" className="px-3 py-2 font-normal">
                {run.number}
              </th>
              <td className="px-3 py-2">{run.shellId}</td>
              <td className="px-3 py-2">{Math.round(run.shellAtMs)} ms</td>
              <td className="px-3 py-2">{run.requestId}</td>
              <td className="px-3 py-2">{Math.round(run.requestAtMs)} ms</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
